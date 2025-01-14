import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { deleteFileFromCloudinary, uploadFileOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose"


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    // Validate query parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new ApiError(400, "Invalid page number");
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        throw new ApiError(400, "Invalid limit number");
    }
    if (userId && !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Build the $match stage
    const matchConditions = {};
    if (query) {
        matchConditions.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
    if (userId) {
        matchConditions.owner = new mongoose.Types.ObjectId(userId);
    }

    // Sort type handling
    const sortDirection = sortType.toLowerCase() === "asc" ? 1 : -1;

    // Build the aggregation pipeline
    const videos = await Video.aggregate([
        { $match: matchConditions },
        {
            $lookup: {
                from: "users", // Assuming the owner collection is named 'users'
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { _id: 1, fullName: 1, email: 1 } }
                ]
            }
        },
        { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },
        { $sort: { [sortBy]: sortDirection } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: (pageNumber - 1) * limitNumber }, { $limit: limitNumber }]
            }
        },
        {
            $project: {
                "metadata.total": 1, // Keep metadata total
                "data._id": 1,
                "data.title": 1,
                "data.description": 1,
                "data.isPublished": 1,
                "data.ownerDetails": 1,
            }
        }

    ]);

    // Prepare the response
    const total = videos[0]?.metadata[0]?.total || 0;
    const videoData = videos[0]?.data || [];

    return res.status(200).json(
        new ApiResponse(200, {
            total,
            page: pageNumber,
            limit: limitNumber,
            videos: videoData
        }, "Videos fetched successfully")
    );
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const userId = req.user?._id;

    // Validate title and description
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Please provide both title and description");
    }

    // Validate video local file path
    const videoLocalFilePath = req.files?.videoFile[0]?.path;
    if (!videoLocalFilePath) {
        throw new ApiError(400, "Video file is required");
    }

    // Upload video to Cloudinary
    let videoCloudinaryFilePath;
    try {
        videoCloudinaryFilePath = await uploadFileOnCloudinary(videoLocalFilePath);
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }

    // Validate thumbnail local file path
    const thumbnailLocalFilePath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalFilePath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    // Upload Thumbail to Cloudinary
    let thumbnailCloudinaryFilePath;
    try {
        thumbnailCloudinaryFilePath = await uploadFileOnCloudinary(thumbnailLocalFilePath);
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }


    // Extract video duration from Cloudinary response
    const videoDuration = videoCloudinaryFilePath.duration;

    // Save video to database
    const video = new Video({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoCloudinaryFilePath.url, // Save the URL from Cloudinary response
        duration: videoDuration,
        owner: userId,
        thumbnail: thumbnailCloudinaryFilePath.url
    });
    await video.save();

    // Respond with the created video
    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video for the current user
    const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
    if (!video) {
        throw new ApiError(404, "Video not found or you do not have access to it");
    }

    const populatedVideo = await Video.findById(video._id).populate("owner", "fullName email");

    // Respond to the client
    return res.status(200).json(
        new ApiResponse(200, populatedVideo, "Fetched video for the given ID")
    );
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const { title, description } = req.body;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video belonging to the authenticated user
    const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Validate thumbnail local file path
    const thumbnailLocalFilePath = req.file.path;
    if (!thumbnailLocalFilePath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    // Upload Thumbail to Cloudinary
    let thumbnailCloudinaryFilePath;
    try {
        thumbnailCloudinaryFilePath = await uploadFileOnCloudinary(thumbnailLocalFilePath);
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }


    let oldThumbnail = video.thumbnail;

    if (oldThumbnail) {
        try {
            await deleteFileFromCloudinary(oldThumbnail);
        } catch (error) {
            console.log("Something went wrong while deleting cover image on cloudinary", error)
        }
    }

    // Conditionally update fields if provided
    if (title && title.trim() !== "") video.title = title.trim();
    if (description && description.trim() !== "") video.description = description.trim();
    video.thumbnail = thumbnailCloudinaryFilePath.url;

    // Save the updated video
    await video.save();



    // Respond to the client
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    );
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video
    const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Delete the file from Cloudinary
    const videoUrl = video.videoFile;
    if (videoUrl) {
        try {
            await deleteFileFromCloudinary(videoUrl); // Ensure this function works correctly
        } catch (err) {
            console.error("Error deleting video from Cloudinary:", err);
        }
    }

    // Delete the video from the database
    await video.deleteOne();

    // Respond to the client
    return res.status(200).json(
        new ApiResponse(200, null, "Video deleted successfully")
    );
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate video ID
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video
    const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Toggle the isPublished status
    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { videoId: video._id, isPublished: video.isPublished },
            `Published status changed to ${video.isPublished ? "published" : "private"}`
        )
    );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}


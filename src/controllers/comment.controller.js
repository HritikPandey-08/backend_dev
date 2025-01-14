import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comments.models.js";
import { Video } from "../models/video.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate query parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new ApiError(400, "Invalid page number");
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        throw new ApiError(400, "Invalid limit number");
    }
    if (videoId && !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Set match conditions dynamically
    const matchConditions = {};
    if (videoId) {
        matchConditions.video = new mongoose.Types.ObjectId(videoId);
        matchConditions.deletedAt = null;
    }

    const comments = await Comment.aggregate([
        { $match: matchConditions },
        {
            $lookup: {
                from: "users",  // Assuming 'users' is the correct collection
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        { $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $skip: (pageNumber - 1) * limitNumber },
                    { $limit: limitNumber },
                ],
            },
        },
    ]);

    // Prepare the response
    const total = comments[0]?.metadata[0]?.total || 0;
    const commentData = comments[0]?.data || [];

    if (total === 0) {
        return res.status(404).json(
            new ApiResponse(404, null, "No comments found")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            total,
            page: pageNumber,
            limit: limitNumber,
            comments: commentData,
        }, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (content.trim() === "") {
        throw new ApiError(400, "Content of comment is required");

    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");

    }

    const comment = new Comment({
        content: content,
        video: videoId,
        owner: req.user?._id
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment.id)
        .populate("owner", "username fullName")
        .populate("video", "title");


    // Send response
    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );

})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    // Validate Comment ID
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "CommentId is not valid");
    }

    // Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment cannot be empty");
    }

    // Find comment owned by the user
    const comment = await Comment.findOne({ _id: commentId, owner: req.user?._id, deletedAt: null });
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Update comment content
    comment.content = content.trim();
    await comment.save();

    // Optionally, populate the response with owner and video info
    const populatedComment = await Comment.findById(comment.id)
        .populate("owner", "username fullName")
        .populate("video", "title");

    return res.status(200).json(   // Return 200 for successful update
        new ApiResponse(200, populatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // Validate Comment ID
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "CommentId is not valid");
    }

    // Find comment owned by the user
    const comment = await Comment.findOne({ _id: commentId, owner: req.user?._id, deletedAt: null });
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Soft delete: Set the deletedAt field
    comment.deletedAt = Date.now();
    await comment.save();

    // Optionally, populate the response with owner and video info
    const populatedComment = await Comment.findById(comment.id)
        .populate("owner", "username fullName")
        .populate("video", "title");

    return res.status(200).json(   // Return 200 for successful deletion
        new ApiResponse(200, populatedComment, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
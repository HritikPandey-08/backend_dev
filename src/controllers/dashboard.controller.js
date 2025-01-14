import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/likes.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Video } from "../models/video.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Fetch total videos and total views
    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    const { totalVideos = 0, totalViews = 0 } = videoStats[0] || {};

    // Fetch total likes
    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos", // Assuming your video collection is named "videos"
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        { $unwind: "$videoDetails" },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ]);

    const { totalLikes: likesCount = 0 } = totalLikes[0] || {};

    // Fetch total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalLikes: likesCount,
            totalSubscribers
        }, "Channel stats fetched successfully")
    );
});



const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new ApiError(400, "Invalid page number");
    }
    if (isNaN(limitNumber) || limitNumber <= 0) {
        throw new ApiError(400, "Invalid limit number");
    }

    const videos = await Video.find({ owner: channelId })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .sort({ createdAt: -1 });

    const totalVideos = await Video.countDocuments({ owner: channelId });

    return res.status(200).json(
        new ApiResponse(200, {
            total: totalVideos,
            page: pageNumber,
            limit: limitNumber,
            videos
        }, "Channel videos fetched successfully")
    );
});


export {
    getChannelStats,
    getChannelVideos
}
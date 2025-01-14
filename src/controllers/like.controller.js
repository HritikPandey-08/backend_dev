import { Like } from "../models/likes.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comments.models.js";
import { Tweet } from "../models/tweets.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const userId = req.user._id;

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, "Like removed"));
    } else {
        const newLike = new Like({ video: videoId, likedBy: userId });
        await newLike.save();

        const populatedLike = await Like.findById(newLike._id)
            .populate('video', '_id title owner')
            .populate('likedBy', 'fullName');

        return res.status(201).json(new ApiResponse(201, populatedLike, "Like added"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await Comment.findOne({ _id: commentId, deletedAt: null, video: { $exists: true } });
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const userId = req.user?._id;

    const existingLikes = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLikes) {
        await Like.deleteOne({ _id: existingLikes._id });
        return res.status(200).json(new ApiResponse(200, "Like removed"));
    } else {
        const newLike = new Like({ comment: commentId, likedBy: userId });
        await newLike.save();

        const populatedLike = await Like.findById(newLike._id)
            .populate('comment', '_id owner')
            .populate('likedBy', 'fullName email');
        return res.status(201).json(new ApiResponse(201, "Like added"));
    }


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await Tweet.findOne({ _id: tweetId, deletedAt: null, tweet: { $exists: true } });
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const userId = req.user?._id;

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, "Like removed"));

    } else {
        const newLike = new Like({
            tweet: tweetId,
            likedBy: userId
        });
        await newLike.save();

        const populatedLike = await Like.findById(newLike._id)
            .populate('tweet', 'content')
            .populate('likedBy', 'fullName email');


        return res.status(201).json(new ApiResponse(201, populatedLike, "Like added",));

    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new ApiError(404, "User Id not found");
    }

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true },
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails", // Flatten the video array
        },
        {
            $project: {
                _id: 0,
                likedBy: 1,
                VideoDetails: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    views: 1,
                    duration: 1,
                    owner: 1,
                },
            },
        },
    ]);

    return res.status(200)
        .json(
            new ApiResponse(
                200,
                likedVideo
            )
        )
})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}

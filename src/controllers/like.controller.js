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

    const video = await Video.findById({ videoId });
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
        return res.status(201).json(new ApiResponse(201, "Like added"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await Comment.findById({ commentId });
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const userId = req.user?._id;

    const existingLikes = await findOne({ comment: commentId, likedBy: userId });

    if (existingLikes) {
        await Like.deleteOne({ _id: existingLikes._id });
        return res.status(200).json(new ApiResponse(200, "Like removed"));
    } else {
        const newLike = new Like({ comment: commentId, likedBy: userId });
        await newLike.save();
        return res.status(201).json(new ApiResponse(201, "Like added"));
    }


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const userId = req.user?._id;

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });
    console.log(existingLike);
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
})


export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweets.models.js";


const createTweet = asyncHandler(async (req, res, next) => {
    const { content } = req.body;

    // Validate tweet content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    // Check if the user exists
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Create the tweet
    const tweet = new Tweet({
        owner: user._id,
        content: content.trim(),
    });

    await tweet.save(); // Ensure the document is saved

    // Populate the `owner` field for a detailed response
    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "fullName email");

    return res.status(201).json(
        new ApiResponse(createdTweet, "Tweet created successfully")
    );
});


const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params?.userId

    // Ensure the user ID is valid
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Fetch all tweets for the user
    const tweets = await Tweet.find({
        owner: userId,     // Condition 1
        deletedAt: null    // Condition 2
    })
        .populate("owner", "name email")
        .select("-createdAt -updatedAt");

    // Handle case where no tweets are found
    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found for this user");
    }

    // Return the tweets
    return res.status(200).json(
        new ApiResponse(200, tweets, "Fetched all tweets for the user successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params?.tweetId; // Extract tweet ID from route parameters
    const { content } = req.body; // Extract new content from request body

    // Validate tweet ID
    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }

    // Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content cannot be empty");
    }

    // Find the tweet by ID
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Ensure the authenticated user is the owner of the tweet
    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    // Update the tweet's content
    tweet.content = content.trim(); // Trim content to avoid unnecessary whitespace
    await tweet.save(); // Save the updated tweet to the database

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet updated successfully")
    );
});


const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params?.tweetId;

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    tweet.deletedAt = new Date();
    await tweet.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    );




});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
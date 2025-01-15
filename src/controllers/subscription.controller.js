import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    // Check if the channel exists (assuming you have a Channel model)
    const channelExists = await User.findById(channelId);
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    // Check for an existing subscription
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    if (existingSubscription) {
        // If subscription exists, remove it
        await Subscription.deleteOne({ _id: existingSubscription._id });
        return res.status(200).json(new ApiResponse(200, "Subscriber removed from the channel"));
    } else {
        // If no subscription exists, create a new one
        const newSubscriber = new Subscription({ subscriber: userId, channel: channelId });
        await newSubscriber.save();
        return res.status(201).json(new ApiResponse(201, "Subscribed to the channel"));
    }
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    // Fetch subscribers for the given channel
    const channelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            },
        },
        {
            $unwind: {
                path: "$subscriberDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriber",
                subscriberDetails: {
                    fullName: 1,
                    email: 1,
                    profilePicture: 1, // Include other necessary fields
                },
            },
        },
    ]);

    if(!channelSubscribers.length) {
        return res.status(404).json(
            new ApiResponse(404, [], "No subscribers found")
        );
    }

    // Return response
    return res.status(200).json(
        new ApiResponse(200, channelSubscribers, "Subscribers fetched successfully")
    );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber Id");
    }
    const userId = req.user?._id

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails"
            },
        },
        {
            $unwind: {
                path: "$channelDetails",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                channelId: "$channel",
                channelDetails: {
                    fullName: 1,
                    email: 1,
                    profilePicture: 1, // Include other necessary fields
                },
            }
        }
    ]);

    // Handle case where no subscriptions are found
    if (!subscribedChannels.length) {
        return res.status(404).json(
            new ApiResponse(404, [], "No subscribed channels found")
        );
    }

    // Return response
    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Channel fetched successfully")
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
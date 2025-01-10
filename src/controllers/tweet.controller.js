import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweets.models.js";


const createTweet = asyncHandler(async (req, res) => {


    
});

const getUserTweet = asyncHandler(async (req, res) => {

});
const updateTweet = asyncHandler(async (req, res) => {

});
const deleteTweet = asyncHandler(async (req, res) => {

});


export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { uploadFileOnCloudinary, deleteFileFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// Generate refresh and access token function
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // Fetch user by ID
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to database
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        // Return the tokens
        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "An unexpected error occurred while generating tokens");
    }
};


// User registration function
const userRegister = asyncHandler(async (req, res) => {

    // Get user details for frontend
    const { fullName, username, email, password } = req.body;

    // validation check 
    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")

    }

    // Find exists users
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }


    // Uploading files on local server
    const avatarLocalFile = req.files?.avatar[0]?.path;


    // const coverImgLocalFile = req.files?.coverImage[0]?.path;

    let coverImgLocalFile;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImgLocalFile = req.files.coverImage[0].path;
    }

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar File is not available in local storage")
    }

    // uploading file on cloudinary
    const avatartFile = await uploadFileOnCloudinary(avatarLocalFile);
    const coverImageFile = await uploadFileOnCloudinary(coverImgLocalFile);

    if (!avatartFile) {
        throw new ApiError(400, "Avatar File not found")

    }

    // creating user object
    const user = await User.create({
        fullName,
        avatar: avatartFile.url,
        coverImage: coverImageFile?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
});


// User Logged-in function 
const userLoggedIn = asyncHandler(async (req, res) => {

    // Extract user data from request body
    const { email, username, password } = req.body

    // check if email or username is present in request body or not
    if (!(email || username)) {
        throw new ApiError(400, "Email Id or Username is required");
    }

    // Finding user in database 
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    // check if user exists in database or not 
    if (!user) {
        throw new ApiError(404, "Email id Or username doesn't exists");
    }

    const checkPassword = await user.isPasswordCorrect(password);


    if (!checkPassword) {
        throw new ApiError(401, "Incorrect email id / username or password")
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User Logged In successfully"
            )
        )
})

// user logged-out function 
const userLoggedOut = asyncHandler(
    async (req, res) => {
        await User.findByIdAndUpdate(req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new: true
            }
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User logout successfully"
                )
            )
    });


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }


    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }


        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user?._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token")
    }

});


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;



    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required");

    }

    const user = await User.findById(req.user?._id);

    const checkOldPassword = await user.isPasswordCorrect(oldPassword);

    if (!checkOldPassword) {
        throw new ApiError(400, "Please enter a valid password");

    }

    if (!(newPassword === confirmPassword)) {
        throw new ApiError(400, "Confirm password does not match with new password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password Change successfully")
        );

});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200,
                req.user,
                "User Data fetched successfully"
            )
        );

});

const updateUserDetail = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "Please enter all details");
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password");

    if (!user) {
        throw new ApiError(400, "Something went wrong while updating user details");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Updated user data successfully")
        );
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalFile = req.file?.path;
    if (!coverImageLocalFile) {
        throw new ApiError(400, "coverImage file not found");
    }

    const coverImageFileUrl = await uploadFileOnCloudinary(coverImageLocalFile);
    if (!coverImageFileUrl.url) {
        throw new ApiError(400, "Something went wrong while uplaoding file on cloudinary");
    }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const oldCoverImageUrl = user.avatar;

    user.coverImage = coverImageFileUrl.url
    await user.save({ validateBeforeSave: false })

    if (oldCoverImageUrl) {
        try {
            await deleteFileFromCloudinary(oldCoverImageUrl);

        } catch (error) {
            console.log("Something went wrong while deleting cover image on cloudinary", error)
        }
    }

    return res.status(200)
        .json(new ApiResponse(200, user,
            "Cover image uploaded successfully"
        ))

});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalFile = req.file?.path;

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar file not found");
    }

    const avatarFileUrl = await uploadFileOnCloudinary(avatarLocalFile);
    if (!avatarFileUrl.url) {
        throw new ApiError(400, "Something went wrong while uplaoding file on cloudinary");
    }

    // Fetch the current user to get the old avatar URL
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const oldAvatarUrl = user.avatar; // Assume `avatar` stores the Cloudinary URL

    // Update the user's avatar in the database
    user.avatar = avatarFileUrl.url;
    await user.save({ validateBeforeSave: false });

    // Delete the old file from Cloudinary, if it exists
    if (oldAvatarUrl) {
        try {
            await deleteFileFromCloudinary(oldAvatarUrl);
        } catch (err) {
            console.error("Error deleting old avatar from Cloudinary:", err);
        }
    }

    return res.status(200)
        .json(new ApiResponse(200, user,
            "Avatar image uploaded successfully"
        ))

});



const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(404, "Username Not found");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "Subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },

        {
            $project: {
                fullName: 1,
                email: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1


            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    console.log(channel);

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel profile data fetched successfully")
        )
});


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ])

    if (!user.length || !user[0]?.watchHistory?.length) {
        return res.status(404)
            .json(
                new ApiResponse(
                    404,
                    [],
                    "No watch history found"
                )
            )
    }


    return res.status(200)
        .json(
            new ApiResponse(
                200,
                user[0].WatchHistory
            )
        )
})

export {
    userRegister,
    userLoggedIn,
    userLoggedOut,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
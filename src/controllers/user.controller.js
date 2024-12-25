import { aysncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";

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
const userRegister = aysncHandler(async (req, res) => {

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
const userLoggedIn = aysncHandler(async (req, res) => {

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
const userLoggedOut = aysncHandler(
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


const refreshAccessToken = aysncHandler(async (req, res) => {
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
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refrsh token is expired or used");
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
    
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user?._id);
    
       return res
       .status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken : newRefreshToken},
                "Access token refreshed successfully"
            )
       )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token")
    }

});


export { userRegister, userLoggedIn, userLoggedOut, refreshAccessToken }
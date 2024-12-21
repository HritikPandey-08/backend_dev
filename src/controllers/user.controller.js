import { aysncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.models.js"
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
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
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
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
        coverImage : coverImageFile?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

    

   



})

export { userRegister }
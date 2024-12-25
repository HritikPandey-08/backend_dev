import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { aysncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = aysncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401,"Unauthorized Request")
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
    
        if(!user){
            throw new ApiError(401,"Invalid access token Request")
        }
    
        req.user = user;
        next(); 
    } catch (error) {
        throw new ApiError(401,error.message || "Invalid access token")
    }  
})


export { verifyJWT }
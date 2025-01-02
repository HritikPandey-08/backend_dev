import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, refreshAccessToken, userLoggedIn, userLoggedOut, userRegister, updateUserDetail, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([  // Adding upload file middleware
        {
            name:"avatar",
            maxCount : 1
        },
        {
            name:"coverImage",
            maxCount : 1
        }
    ]),
    userRegister);

router.route("/login").post(userLoggedIn);

// secured routes
router.route("/logout").post(verifyJWT,userLoggedOut);
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateUserDetail)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").get(verifyJWT,getWatchHistory);

router.route("/refresh-token").post(refreshAccessToken);




export default router
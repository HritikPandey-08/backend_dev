import { Router } from "express";
import { refreshAccessToken, userLoggedIn, userLoggedOut, userRegister } from "../controllers/user.controller.js";
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
router.route("/refresh-token").post(refreshAccessToken);



export default router
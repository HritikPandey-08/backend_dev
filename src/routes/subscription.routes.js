import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router
    .route("/channels/:subscriberId")
    .get(getSubscribedChannels); // Fetch the list of channels a user has subscribed to

router
    .route("/subscribers/:channelId") 
    .get(getUserChannelSubscribers); // Fetch the list of subscribers for a channel

router
    .route("/c/:channelId")
    .post(toggleSubscription); // Toggle subscription for a channel

export default router
import express from "express";
import cors from "cors";
import cookirParse from "cookie-parser";

const app = express();

// use cors 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))

// use to set the limit on json data 
app.use(express.json({
    limit: "16kb"
}))

// use to encode the %20 type of things in url
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

// use to keep file in public folder 
app.use(express.static("public"))

app.use(cookirParse())


import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import likeRouter from "./routes/like.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);


export { app }
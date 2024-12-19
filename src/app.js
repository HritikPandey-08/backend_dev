import express from "express";
import cors from "cors";
import cookirParse from "cookie-parser";

const app = express();

// use cors 
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credential : true
}))

// use to set the limit on json data 
app.use(express.json({
    limit : "16kb"
}))

// use to encode the %20 type of things in url
app.use(express.urlencoded({
    extended : true,
    limit : "16kb"
}))

// use to keep file in public folder 
app.use(express.static("public"))

app.use(cookirParse())


import userRoutes from "./routes/user.routes.js";

app.use("/api/v1/user",userRoutes)

export {app}
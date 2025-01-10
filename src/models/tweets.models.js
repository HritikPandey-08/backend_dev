import mongoose from "mongoose";

const tweetsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: {
            type: String,
            required: [true, "Tweet content is required"],
            maxlength: [280, "Tweet content must not exceed 280 characters"], // Optional limit for content        
        },
        deletedAt: {
            type: Date,
            default: null
        }

    },
    {
        timestamps: true
    }
);

export const Tweet = mongoose.model("Tweet", tweetsSchema);
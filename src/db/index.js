import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const connectInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connectedd !! DB Host : ${connectInstance.connection.host}`);

        
    } catch (error) {
        console.log("Failed to connect ",error);
        throw error

    }
}

export default connectDB
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

// Upload an image
const uploadFileOnCloudinary = async (localFilePath) => {

    try {

        console.log("Local file path of  cloudinary function is ", localFilePath);

        if (!localFilePath) return null



        //upload file on cloudinary
        const uploadedFile = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto"
            }
        )
        // file has been uploaded successfull
        fs.unlinkSync(localFilePath)
        console.log("file is uploaded on cloudinary ", uploadedFile.url);
        return uploadedFile;


    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.log("Error occur while uploading file using cloudinary", error)
        return null;
    }

}

// Delete old file from cloudinary
const deleteFileFromCloudinary = async (fileUrl) => {
    if (!fileUrl) return null

    const publicId = fileUrl.split("/").pop().split(".")[0]; // Extract the public ID from the URL
    await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
            throw new Error("Error deleting file from Cloudinary");
        }
        return result;
    });

}

export { uploadFileOnCloudinary, deleteFileFromCloudinary }
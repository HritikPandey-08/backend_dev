import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/palylists.models.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    // Validate fields
    if (!name || typeof name !== 'string' || name.trim() === "") {
        throw new ApiError(400, "Name is required and cannot be empty");
    }

    if (!description || typeof description !== 'string' || description.trim() === "") {
        throw new ApiError(400, "Description is required and cannot be empty");
    }

    const userId = req.user?._id;

    const playlist = new Playlist({
        name: name,
        description: description,
        owner: userId
    });

    await playlist.save();

    return res.status(200)
        .json(new ApiResponse(201, "Playlist created"));

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    // Fetch playlists for the user
    const userPlaylists = await Playlist.find({ owner: userId })
        .populate("videos", "title description") // Fetch video details (optional)
        .populate("owner", "fullName email"); // Fetch owner details (optional)

    // Check if playlists exist
    if (userPlaylists.length === 0) {
        throw new ApiError(404, "No playlists found for this user");
    }

    // Return response
    return res.status(200).json(
        new ApiResponse(200, userPlaylists, "Fetched user playlists successfully")
    );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const userPlaylist = await Playlist.find({ _id: playlist._id })
        .populate("videos", "title description")
        .populate("owner", "fullName email");

    // Return response
    return res.status(200).json(
        new ApiResponse(200, userPlaylist, "Fetched playlist successfully")
    );


})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }


    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if video already exists in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "video added to playlist successfully")
    );




})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    // Find the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the video exists in the playlist
    const videoIndex = playlist.videos.indexOf(videoId);
    if (videoIndex === -1) {
        throw new ApiError(404, "Video not found in the playlist");
    }

    // Remove the video from the playlist
    playlist.videos.splice(videoIndex, 1); // Removes 1 element at the index
    await playlist.save();

    // Return response
    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlist ID
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    // Find the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Delete the playlist
    await Playlist.findByIdAndDelete(playlistId);

    // Return success response
    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );
});


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    // Validate playlist ID
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    // Validate fields
    if (!name || typeof name !== 'string' || name.trim() === "") {
        throw new ApiError(400, "Name is required and cannot be empty");
    }

    if (!description || typeof description !== 'string' || description.trim() === "") {
        throw new ApiError(400, "Description is required and cannot be empty");
    }

    // Find the playlist
    const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user?._id });
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Update fields
    playlist.name = name.trim();
    playlist.description = description.trim();


    await playlist.save();

    // Return success response
    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    );

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
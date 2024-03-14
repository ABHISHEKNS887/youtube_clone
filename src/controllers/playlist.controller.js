import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Playlist} from "../models/playlist.model.js";
import mongoose, {isValidObjectId} from "mongoose";
import { verifyVideo } from "./video.controller.js";

const createPlaylist = asyncHandler( async(req, res) => {
    const {name, description} = req.body;

    if (!(name && description)) {
        throw new ApiError(404, "name and description is required")
    }

    const playList = await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id
    })

    const createdPlayList =  await Playlist.findById(playList._id)

    res
    .status(200)
    .json(new ApiResponse(200, createdPlayList, "Play List created successfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!(playlistId && videoId)) {
        throw new ApiError(404, "playList and video Id is required")
    }

    if (!(mongoose.isValidObjectId(playlistId))) {
        throw new ApiError(400, "playlistId is invalid")
    }

    if (!(mongoose.isValidObjectId(videoId))) {
        throw new ApiError(400, "videoId is invalid")
    }

    await verifyVideo(videoId)

    const playList = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet: {
                videos: videoId, // $addToSet is useful for ensuring that elements within an array remain unique.
            }
        },
        {
            new: true, // to return the updated document
        })

    if (!playList) {
        throw new ApiError(404, "play list not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, playList, "Added video to playlist"))

})
const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params
    // Remove video from playlist
    if (!(playlistId && videoId)) {
        throw new ApiError(404, "playList and video Id is required")
    }

    if (!(mongoose.isValidObjectId(playlistId))) {
        throw new ApiError(400, "playlistId is invalid")
    }

    if (!(mongoose.isValidObjectId(videoId))) {
        throw new ApiError(400, "videoId is invalid")
    }

    await verifyVideo(videoId)

    const playList = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: {
                videos: videoId, // Pulls items from the array atomically. 
            }
        },
        {
            new: true, // to return the updated document
        })

    if (!playList) {
        throw new ApiError(404, "play list not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, playList, "Removed video to playlist"))


})
export {createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist}
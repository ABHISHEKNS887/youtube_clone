import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getAllVideos = asyncHandler( async(req, res) => {
     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //Get all videos based on query, sort, pagination
})

const publishVideo = asyncHandler( async(req, res) => {
    const { title, description} = req.body;
    // Get video, upload to cloudinary, create video
    
    if (!(title && description)) {
        throw new ApiError(404, "Title and description is required")
    }

    const videoLocalPath = req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0 ? req.files.videoFile[0]?.path : null
    const thumbnailPath = req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0 ? req.files.thumbnail[0]?.path : null

    if (!(videoLocalPath && thumbnailPath)) {
        throw new ApiError(404, "VideoFile and Thumbnail is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const publishVideo = await Video.create(
        {
            videoFile: video?.url,
            thumbnail: thumbnail?.url,
            title: title,
            description: description,
            duration: video?.duration,
            views: 0, // TODO:,
            isPublished: true,
            owner: req.user?._id
        }
    )

    const createdVideo = await Video.findById(publishVideo._id)

    if (!createdVideo) {
        throw new Error(500, "Something went wrong while publishing the video")
    }

    res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video Published Successfully"))


})

export {getAllVideos, publishVideo}
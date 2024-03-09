import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

async function verifyVideo(videoId) {
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video Not Found");
    }
    return video;
}

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

const getVideoById = asyncHandler( async(req, res) => {
    //Get video by id
    const {videoId} = req.params

    if (!videoId) {
        throw new ApiError(404, "Video Id is required")
    }

    const video = await verifyVideo(videoId);

    // Increment the views field by 1
    video.views += 1;

    await video.save();

    res
    .status(200)
    .json(new ApiResponse(200, video, "Video details fetched successfully"))
})

const updateVideoById = asyncHandler(async(req, res) => {
    //Update video details like title, description, thumbnail
    const { videoId } = req.params
    const {title, description} = req.body

    const thumbnailPath = req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0 ? req.files.thumbnail[0]?.path : null

    if (!(thumbnailPath && title && description)){
        throw new ApiError(404, "thumbnail, title, description is required")
    }

    if (!videoId) {
        throw new ApiError(404, "Video Id is required")
    }

    const video = await verifyVideo(videoId);

    await deleteOnCloudinary(video?.thumbnail, "image")

    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    const updateVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                thumbnail: thumbnail.url,
                title: title,
                description: description
            }
        },
        {
                new: true
            })

    res.
    status(200)
    .json(new ApiResponse(200, updateVideo, "Video updated successfully"))


})

const deleteVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //Delete video

    if (!videoId) {
        throw new ApiError(404, "Video Id is required")
    }

    const video = await verifyVideo(videoId);

    await deleteOnCloudinary(video?.videoFile, "video")
    await deleteOnCloudinary(video?.thumbnail, "image")

    const deleteVideo = await Video.findByIdAndDelete(videoId)

    if (!deleteVideo){
        throw new ApiError(500, "Something went wrong while deleteing video by id")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted Successfully"))

})

const togglePublishStatus = asyncHandler(async(req, res) => {
    const { videoId } = req.params;
    const {toggle} = req.body;

    if (!videoId) {
        throw new ApiError(404, "Video Id is required")
    }
    
    if (!("toggle" in req.body)) {
        throw new ApiError(404, "toggle is required")
    }

    await verifyVideo(videoId);

    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: toggle
            }
        },
        {
            new: true
        })

    if (!updatedVideo) {
        throw new ApiError(500, 'Something went wrong while updating toggle status')
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, `Published Status updated to ${toggle}`))
    
})

export {getAllVideos, publishVideo, getVideoById, updateVideoById, deleteVideoById, togglePublishStatus, verifyVideo}

import mongoose, {isValidObjectId} from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { Like } from "../models/like.model.js";
import { Video } from '../models/video.model.js';
import { Comment } from '../models/comment.model.js';
import { Tweet } from '../models/tweet.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const toggleVideoLike = asyncHandler (async (req, res) => {
    const {videoId} = req.params;

    // Validate if videoId is a valid ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }
    let like = false;
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const findVideoLike = await Like.find({
        video: videoId,
        likedBy: req.user?._id
    })

    if ((findVideoLike.length > 0) && (findVideoLike[0].likedBy.equals(req.user?._id))){
        await Like.deleteOne({
        video: videoId,
        likedBy: req.user?._id
    })
    }
    else {
        const videoLike = await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })
    if (!videoLike) {
        throw new ApiError(500, "Something went wrong while liking the video");
    }
    like = true;
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, `${like ? 'Liked': 'Disliked'} the videoID: ${videoId}`))

})

const toggleCommentLike = asyncHandler (async (req, res) => {
    const {commentId} = req.params;
    let like = false;
    // Validate if videoId is a valid ObjectId
    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const findCommentLike = await Like.find({
        comment: commentId,
        likedBy: req.user?._id
    })

    if ((findCommentLike.length > 0) && (findCommentLike[0].likedBy.equals(req.user?._id))){
        await Like.deleteOne({
        comment: commentId,
        likedBy: req.user?._id
    })
    }
    else {
        const commentLike = await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (!commentLike) {
        throw new ApiError(500, "Something went wrong while liking the comment");
    }
    like = true;
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, `${like ? 'Liked': 'Disliked'} the commentID: ${commentId}`))

})

const toggleTweetLike = asyncHandler (async (req, res) => {
    const {tweetId} = req.params;
    let like = false;
    // Validate if videoId is a valid ObjectId
    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "tweet not found");
    }

    const findTweetLike = await Like.find({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (findTweetLike.length > 0) {
        await Like.deleteOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    }
    else {
        const tweetLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (!tweetLike) {
        throw new ApiError(500, "Something went wrong while liking the tweet");
    }
    like = true;
    }

    res
    .status(200)
    .json(new ApiResponse(200, {}, `${like ? 'Liked': 'Disliked'} the tweetID: ${tweetId}`))

})

const getLikedVideos = asyncHandler(async (req, res) => {
    //Get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoData",
                pipeline: [
                            {
                                $project: {
                                    thumbnail: 1,
                                    title: 1,
                                    description: 1,
                                    owner: 1,
                                    duration: 1,
                                    views: 1,
                                    createdAt: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $unwind: "$videoData"
                },
                {
                    $replaceRoot: {
                        newRoot: "$videoData"
                    }
                }
            ]);
            
    if (!likedVideos?.length) {
            throw new ApiError(404, "liked Videos not found")
        }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {
            likedVideosCount: likedVideos.length,
            likedVideos: likedVideos},
            "liked Videos fetched successfully")
    )
})
export {toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos}
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    //Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelStats = {owner: req.user?._id, totalVideos: 0, totalviews: 0, totalSubscribers: 0, totallikes: 0}

    const video = await Video.find({
        owner: req.user?._id
    })

    if (Array.isArray(video) && video.length > 0) {
        channelStats.totalVideos = video.length
        channelStats.totalviews = video.map(totalview => totalview.views).reduce((acc, curr) => acc+curr, 0)

        const videoIds = video.map(ids => ids._id.toString())

        const likes = await Like.find({
        video: { $in: videoIds}
        })

        if (Array.isArray(likes) && likes.length > 0) {
            channelStats.totallikes = likes.length
        }

    }

    const subscribers = await Subscription.find({
        channel: req.user?._id
    })

    if (Array.isArray(subscribers) && subscribers.length > 0) {
        channelStats.totalSubscribers = subscribers.length
    }

    res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"))


});

export {getChannelStats}
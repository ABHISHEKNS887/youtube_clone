import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, {isValidObjectId} from "mongoose"
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { Subscription } from "../models/subscription.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    // Toggle subscription

    if (!channelId) {
        throw new ApiError(404, "Channel Id is required")
    }

    const checkSubscriber = await Subscription.find({
        subscriber: req.user?._id
    })

    if (checkSubscriber){
        throw new ApiError(404, "User Subscribed already")
    }
    
    const subscribe = await Subscription.create(
        {
            subscriber: req.user?._id,
            channel: channelId
        }
    )

    const findSubscriber = await Subscription.findById(subscribe._id)

    if (!findSubscriber) {
        throw new ApiError(500, "Something went wrong while subscribing")
    }

    res
    .status(200)
    .json(new ApiResponse(200,
        findSubscriber,
        "Subscribed successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId) {
        throw new ApiError(404, "subscriber Id is required")
    }

    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Invalid Subscribe Id has been provided")
    }

    const subscribedList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedTo"
        },
        {
            $replaceRoot: {
                newRoot: "$subscribedTo"
            }
        }
    ])

    if (!subscribedList?.length) {
        throw new ApiError(404, "Subscribers not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {
        subscriberId: subscriberId,
        subscribersCount: subscribedList?.length,
        subscribers: subscribedList}, "Subscribed list fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler( async(req, res) => {
        const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(404, "subscriber Id is required")
    }

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Subscribe Id has been provided")
    }

    const subscribersList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribers"
        },
        {
            $replaceRoot: {
                newRoot: "$subscribers"
            }
        }
    ])

    if (!subscribersList?.length) {
        throw new ApiError(404, "Subscribers not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {
        channelId: channelId,
        subscribersCount: subscribersList?.length,
        subscribers: subscribersList}, "Subscribers list fetched successfully"))
})

export {toggleSubscription, getUserChannelSubscribers, getSubscribedChannels}
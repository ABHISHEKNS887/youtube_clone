import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const OPTIONS = {
    httpOnly: true,
    secure: true
}

// An access token is a temporary authorization credential granted to a user or application, allowing access to specific 
// resources or services for a limited period.

// A refresh token is a long-lived credential used to obtain new access tokens without requiring the user to re-enter 
// their credentials, ensuring continuous access to protected resources even after access token expiration.

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Access and Refresh Token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from front end
    // validation - not empty
    // check if user is already registered - email, username
    // check for images and avatars.
    // upload it to cloudinary. avatar check.
    // create user object - create entry in DB.
    // remove password and refresh token field from response
    // Check for user creation
    // return response

    const {fullName, email, password, userName} = req.body;


    if (
        [fullName, email, password, userName].some((field) =>
        field?.trim() === "")
        ) {
        throw new ApiError(400, "All fields are required.")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { userName}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or userName already exists.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ? req.files.coverImage[0].path : null;

    if (!avatarLocalPath){
        throw new ApiError(400, 'Avatar file is required.')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    
    if (!avatar){
        throw new ApiError(400, 'Avatar file is required.')
    }

    const user = await User.create({
        fullName,
        email: email,
        userName: userName.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully.")
    )
})

const loginUser = asyncHandler ( async (req, res) => {
    // req body -> data
    // username or email 
    // find user
    // password check
    // access and refresh token 
    // send cookies

    const {userName, email, password} = req.body

    if (!userName && !email) {
        throw new ApiError(400, "UserName and Email is required.")
    }

    const existedUser = await User.findOne({
        $or: [{userName}, {email}]
    })

    if (!existedUser) {
        throw new ApiError(404, "User does not exist.")
    }

    const isPasswordValid = await existedUser.isPasswordCorrect(password)
    console.log(isPasswordValid)

    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect Password.")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(existedUser._id)

    const loggedInUser = await User.findById(existedUser._id).select(" -password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, OPTIONS)
    .cookie("refreshToken", refreshToken, OPTIONS)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )

})

const logoutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1}, // This will remove the filed from the document.
        },
        {
            new: true // This will return the data after update.
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", OPTIONS)
    .clearCookie("refreshToken", OPTIONS)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler( async(req, res) => {
        const incomingRefreshToken = req.cookies.refresToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new Error(401, "Unauthenticated Error")
        }

        try {
            const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
            const user = await User.findById(decodedToken?._id)
    
            if (!user){
                throw new ApiError(401, "Invalid Refresh Token")
            }
    
            if (incomingRefreshToken !== user.refreshToken){
                throw new ApiError(401, "Refresh Token is expired or used")
            }
    
            const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    
            return res
            .status(200)
            .cookie("accessToken", accessToken, OPTIONS)
            .cookie("refreshToken", refreshToken, OPTIONS)
            .json( new ApiResponse(
                200,
                {accessToken: accessToken, refreshToken: refreshToken},
                "Access Token Refreshed"
            ))
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid Refresh Token")
        }
        

})

const changeCurrentPassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid Old Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: true});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed successfully"))
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, {user: req.user}, "Current User fetched successfully"))
})

const updateAccountDetails = asyncHandler( async(req, res) => {
    const { fullName, email} = req.body;

    if (!(fullName && email)) {
        throw new ApiError(401, "fullName and email are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {
            new: true
        }).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(401, "Error while uploading avatra")
    }

    const user = await User.findByIdandUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }).select("-password")

    await deleteOnCloudinary(avatarLocalPath)
    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))
    
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(401, "cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(401, "Error while uploading coverImage")
    }

    const user = await User.findByIdandUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }).select("-password")

    await deleteOnCloudinary(coverImageLocalPath)
    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))
    
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
        const { username } = req.params

        if (!username?.trim()) {
            throw new ApiError(404, "Username is missing")
        }

        const channel = await User.aggregate([
            {
                $match: {
                    userName: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscriberedto"
                }
            },
            {
                $addFields: {
                    subscribersCount: {
                        $size: "$subscribers"
                    },
                    channelSubscribedToCount: {
                        $size: "$subscriberedto"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    userName: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelSubscribedToCount: 1,
                    isSubscribed: 1
                }
            }
        ])

        if (!channel?.length) {
            throw new ApiError(404, "Channel not found")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        )

})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localfield: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        from: "users",
                        localfield: "owner",
                        foreignField: "_id",
                        as: "owner",
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
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    const data = Array.isArray(user) && user.length > 0? user[0].watchHistory: {}

    return res
    .status(200)
    .json(new ApiResponse(200, 
        data,
        "Watch History fetched successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, 
updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory}
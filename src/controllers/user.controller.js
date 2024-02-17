import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { jwt } from "jsonwebtoken";

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
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { refresToken: undefined},
        },
        {
            new: true
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
    
            const user = await User.findOne(decodedToken?._id)
    
            if (!user){
                throw new ApiError(401, "Invalid Refresh Token")
            }
    
            if (incomingRefreshToken !== user.refresToken){
                throw new ApiError(401, "Refresh Token is expired or used")
            }
    
            const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    
            return res
            .status(200)
            .cookie("accessToken", accessToken, OPTIONS)
            .cookie("refreshToken", newRefreshToken, OPTIONS)
            .json( new ApiResponse(
                200,
                {accessToken: accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            ))
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid Refresh Token")
        }
        

})

export {registerUser, loginUser, logoutUser, refreshAccessToken}
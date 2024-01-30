import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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

export {registerUser}
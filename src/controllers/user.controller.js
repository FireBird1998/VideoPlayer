import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.models.js";
import  uploadOnCloudinary  from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the tokens !!");
    }
};

const userRegister = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (username === "") {
        throw new ApiError(400, "username is required !!");
    }
    if (fullName === "") {
        throw new ApiError(400, "Full name is required !!");
    }
    if (email === "") {
        throw new ApiError(400, "Email is required !!");
    }
    if (password === "") {
        throw new ApiError(400, "Password is required !!");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("Avatar Local Path :- ", avatarLocalPath);

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // console.log("Avatar :- ", avatar);
    let coverImage = null;

    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        throw new ApiError(400, "Avatar file failed to upload");
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    });

    const createdUser = await User.findById(user._id)

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the User !!"
        );
    }

    console.log("User created successfully !!");

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser.toJSON(),
            "User Registered Successfully."
        )
    );
});

const userLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (email === "") {
        throw new ApiError(400, "Email is required !!");
    }
    if (password === "") {
        throw new ApiError(400, "Password is required !!");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User with email does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    res.cookie("refreshToken", refreshToken, cookieOptions);
    res.cookie("accessToken", accessToken, cookieOptions);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                ...user.toJSON(),
                accessToken,
                refreshToken
            },
            "User Logged in Successfully."
        )
    );
});

const userLogout = asyncHandler(async (req, res) => {
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "User Logged out Successfully."
        )
    );
});

export { 
    userRegister,
    userLogin,
    userLogout
};
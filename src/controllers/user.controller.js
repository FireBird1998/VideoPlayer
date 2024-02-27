import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  //we are generating the access token and refresh token
  try {
    //we are finding the user with the user id
    const user = await User.findById(userId);

    //if user is not found then we are throwing an error
    if (!user) {
      throw new ApiError(404, "User with id does not exist");
    }

    //we are generating the access token and refresh token
    //notice we are calling the instance method of the user object
    //never call the instance method of the model directly (here model is in the code ModelName.methodName() is wrong)
    //call the instance method of the object returned by the model method (here model is in the code object.methodName() is correct)
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    //we are saving the refresh token in the user model
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the tokens !!"
    );
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

  const createdUser = await User.findById(user._id);

  if (!createdUser) {
    throw new ApiError(
      500,
      "Something went wrong while registering the User !!"
    );
  }

  console.log("User created successfully !!");

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser.toJSON(),
        "User Registered Successfully."
      )
    );
});

const userLogin = asyncHandler(async (req, res) => {
  //we are accpectig email and password from the user
  const { email, password } = req.body;
  // console.log(req.body);

  //if email is empty then we are throwing an error
  if (email === "" || email === undefined) {
    throw new ApiError(400, "Email is required !!");
  }

  //if password is empty then we are throwing an error
  if (password === "" || password === undefined) {
    throw new ApiError(400, "Password is required !!");
  }
  // console.log("Email :- ", email);
  //we are finding the user with the email
  const user = await User.findOne({ email });
  // console.log("User :- ", user);

  //if user is not found then we are throwing an error
  if (!user) {
    throw new ApiError(404, "User with email does not exist");
  }

  //we are checking the password is correct or not and **isPasswordCorrect** will return true or false however
  // notice isPassword is a method which is defined in the User model but here we are not calling our User model directely we are calling the password method from the user object. as we are using the instance method of the object returned by the findOne method.
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  //if password is not correct then we are throwing an error
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is incorrect");
  }

  //if user is found and password is correct then we are generating the access token and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //we are setting the refresh token and access token in the cookies
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  //we are setting the refresh token and access token in the cookies
  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, cookieOptions);

  //we are sending the user details and access token and refresh token in the response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...user.toJSON(),
        accessToken,
        refreshToken,
      },
      "User Logged in Successfully."
    )
  );
});

const userLogout = asyncHandler(async (req, res) => {
  //we are finding the user by id and setting the refresh token to empty
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true, runValidators: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res.clearCookie("refreshToken", cookieOptions);
  res.clearCookie("accessToken", cookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User Logged Out Successfully."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies || req.body || req.query || req.headers;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh Token is required !!");
  }

  let decoded = null;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(
      401,
      "Invalid Refresh Token !! Not a valid JWT Token !!"
    );
  }

  let user = null;
  try {
    user = await User.findById(decoded?._id);
  } catch (error) {
    throw new ApiError(500, "Database error: " + error.message);
  }

  if (!user) {
    throw new ApiError(404, "User with id does not exist");
  }

  if (user?.refreshToken !== refreshToken) {
    throw new ApiError(
      401,
      "Invalid Refresh Token !! Not a valid Refresh Token Or Might have been expired !!"
    );
  }

  let tokens = null;
  try {
    tokens = await generateAccessAndRefreshTokens(user._id);
  } catch (error) {
    throw new ApiError(500, "Token generation error: " + error.message);
  }

  const { accessToken, refreshToken: newRefreshToken } = tokens;

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  res.cookie("refreshToken", newRefreshToken, cookieOptions);
  res.cookie("accessToken", accessToken, cookieOptions);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...user.toJSON(),
        accessToken,
        refreshToken: newRefreshToken,
      },
      "AccessToken Generated Successfully and Refreshed."
    )
  );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (currentPassword === "" || currentPassword === undefined) {
    throw new ApiError(400, "Current Password is required !!");
  }

  if (newPassword === "" || newPassword === undefined) {
    throw new ApiError(400, "New Password is required !!");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User with id does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current Password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password Changed Successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "Current User Details.")
  );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (fullName === "") {
    throw new ApiError(400, "Full Name is required !!");
  }
  if (email === "") {
    throw new ApiError(400, "Email is required !!");
  }

  let user = null;
  try {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new ApiError(404, "User with id does not exist");
    }
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Database error: " + error.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Account Details Updated."));
});

const updateUserAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file failed to upload !! this is coming from cloudinary.");
  }

  let user = null;
  try {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      { new: true }
    );
    if (!user) {
      throw new ApiError(404, "User with id does not exist");
    }
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Database error: " + error.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Avatar Updated."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Cover Image file failed to upload !! this is coming from cloudinary.");
  }

  let user = null;
  try {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      { new: true }
    );
    if (!user) {
      throw new ApiError(404, "User with id does not exist");
    }
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Database error: " + error.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user.toJSON(), "Cover Image Updated."));
});

export {
  userRegister,
  userLogin,
  userLogout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatarImage,
  updateUserCoverImage,
};

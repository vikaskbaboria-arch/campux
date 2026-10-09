import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/User.model.js";
import College from "../models/college.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generation token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("BODY:", req.body);
  console.log("CONTENT TYPE:", req.headers["content-type"]);
  const { username, name, email, password, college } = req.body;

  if ([username, name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    name,
    email: email,
    password: password,
  });

  const createdUser = await User.findById(user._id).select("-password ");
  if (!createdUser) {
    throw new ApiError(500, "Somwthing went wrong while registering thee user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken".accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Acces token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invaild refresh token");
  }
});

const getProfile = asyncHandler(async (req, res) => {
  const data = req.user;
  if (!data) {
    throw new ApiError(400, "User id is required");
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "user not found");
  }
  const showProfile = await User.findById(req.user._id)
    .select("-password -refreshToken")
    .populate("college");
  return res
    .status(200)
    .json(new ApiResponse(200, showProfile, "User profile found Successfuly"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not valid");
  }
  const { name, username, college, email, branch, year, password, profilePic } = req.body;
  const updateData = {};

  if (username !== undefined) {
    updateData.username = username;
  }
  if (password !== undefined) {
    updateData.password = password;
  }
  if (name !== undefined) {
    updateData.name = name;
  }
  if (college !== undefined) {
    updateData.college = college;
  }

  if (year !== undefined) {
    updateData.year = Number(year);
  }
  if (branch !== undefined) {
    updateData.branch = branch;
  }
  if (email !== undefined) {
    updateData.email = email;
  }

  if (username || email) {
    const existingUser = await User.findOne({
      $or: [
        ...(username ? [{ username: username.toLowerCase().trim() }] : []),
        ...(email ? [{ email: email.toLowerCase().trim() }] : []),
      ],
      _id: { $ne: userId },
    });
    if (existingUser) {
      throw new ApiError(409, "username or email is already taken");
    }
  }
  if (req.file) {
    console.log(req.file.path)
    const result = await uploadOnCloudinary(req.file.path);
     console.log("result",result)
    if (!result) {
      throw new ApiError(500, "Profile picture upload failed");
    }

    updateData.profilePic = result.secure_url;
  } else if (profilePic !== undefined) {
    updateData.profilePic = profilePic;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: updateData,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select("-password -refreshToken")
    .populate("college");

  if (!updatedUser) {
    throw new ApiError(500, "user not updated");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User Updated Successfully"));
});

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "UserId is not valid");
  }
  const user = await User.findById(userId)
    .select("-password -refreshToken -email")
    .populate("college", "name shortName collegesite location.state");
  if (!user) {
    throw new ApiError(404, "User not found ");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "user Found Successfully"));
});
// getUserListings()

export {
  refreshAccessToken,
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  getUserById,
};

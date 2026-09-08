import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { Document } from "../models/document.model.js";

import  asyncHandler  from "../utils/asyncHandler.js";
import { ApiError }  from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";

const generateTokens = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  const accessToken =
    user.generateAccessToken();

  const refreshToken =
    user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  return {
    accessToken,
    refreshToken,
  };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

const registerUser = asyncHandler(
  async (req, res) => {
    const {
      username,
      fullname,
      email,
      password,
    } = req.body;

    if (
      !username ||
      !fullname ||
      !email ||
      !password
    ) {
      throw new ApiError(
        400,
        "All fields are required"
      );
    }

    const existingUser =
      await User.findOne({
        $or: [
          { email },
          { username },
        ],
      });

    if (existingUser) {
      throw new ApiError(
        409,
        "User with this email or username already exists"
      );
    }

    const user = await User.create({
      username,
      fullname,
      email,
      password,
    });

    const createdUser =
      await User.findById(user._id).select(
        "-password -refreshToken"
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user: createdUser,
        },
        "User registered successfully"
      )
    );
  }
);

const loginUser = asyncHandler(
  async (req, res) => {
    const { email, password } =
      req.body;

    if (!email || !password) {
      throw new ApiError(
        400,
        "Email and password are required"
      );
    }

    const user =
      await User.findOne({ email }).select(
        "+password +refreshToken"
      );

    if (!user) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const isPasswordCorrect =
      await user.isPasswordCorrect(
        password
      );

    if (!isPasswordCorrect) {
      throw new ApiError(
        401,
        "Invalid email or password"
      );
    }

    const {
      accessToken,
      refreshToken,
    } = await generateTokens(
      user._id
    );

    user.lastLogin = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    const loggedInUser =
      await User.findById(
        user._id
      ).select(
        "-password -refreshToken"
      );

    return res
      .status(200)
      .cookie(
        "accessToken",
        accessToken,
        cookieOptions
      )
      .cookie(
        "refreshToken",
        refreshToken,
        cookieOptions
      )
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
          },
          "Login successful"
        )
      );
  }
);

const logoutUser = asyncHandler(
  async (req, res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: "",
        },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .clearCookie(
        "accessToken",
        cookieOptions
      )
      .clearCookie(
        "refreshToken",
        cookieOptions
      )
      .json(
        new ApiResponse(
          200,
          null,
          "Logout successful"
        )
      );
  }
);

const refreshAccessToken =
  asyncHandler(
    async (req, res) => {
      const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken;

      if (!incomingRefreshToken) {
        throw new ApiError(
          401,
          "Refresh token is required"
        );
      }

      let decodedToken;

      try {
        decodedToken =
          jwt.verify(
            incomingRefreshToken,
            process.env
              .REFRESH_TOKEN_SECRET
          );
      } catch {
        throw new ApiError(
          401,
          "Invalid or expired refresh token"
        );
      }

      const user =
        await User.findById(
          decodedToken._id
        ).select("+refreshToken");

      if (!user) {
        throw new ApiError(
          401,
          "Invalid refresh token"
        );
      }

      if (
        user.refreshToken !==
        incomingRefreshToken
      ) {
        throw new ApiError(
          401,
          "Refresh token is expired or invalid"
        );
      }

      const accessToken =
        user.generateAccessToken();

      const refreshToken =
        user.generateRefreshToken();

      user.refreshToken =
        refreshToken;

      await user.save({
        validateBeforeSave: false,
      });

      return res
        .status(200)
        .cookie(
          "accessToken",
          accessToken,
          cookieOptions
        )
        .cookie(
          "refreshToken",
          refreshToken,
          cookieOptions
        )
        .json(
          new ApiResponse(
            200,
            {
              accessToken,
            },
            "Access token refreshed successfully"
          )
        );
    }
  );

const getCurrentUser = asyncHandler(
  async (req, res) => {
    const user =
      await User.findById(
        req.user._id
      ).select(
        "-password -refreshToken"
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { user },
        "Current user fetched successfully"
      )
    );
  }
);

const changePassword = asyncHandler(
  async (req, res) => {
    const {
      oldPassword,
      newPassword,
    } = req.body;

    if (!oldPassword || !newPassword) {
      throw new ApiError(
        400,
        "Old password and new password are required"
      );
    }

    const user =
      await User.findById(
        req.user._id
      ).select("+password");

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const isPasswordCorrect =
      await user.isPasswordCorrect(
        oldPassword
      );

    if (!isPasswordCorrect) {
      throw new ApiError(
        401,
        "Old password is incorrect"
      );
    }

    user.password = newPassword;
    user.refreshToken = "";

    await user.save();

    return res
      .status(200)
      .clearCookie(
        "accessToken",
        cookieOptions
      )
      .clearCookie(
        "refreshToken",
        cookieOptions
      )
      .json(
        new ApiResponse(
          200,
          null,
          "Password changed successfully. Please login again."
        )
      );
  }
);

const updateProfile = asyncHandler(
  async (req, res) => {
    const {
      fullname,
      username,
      bio,
      avatar,
    } = req.body;

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    if (
      username &&
      username !== user.username
    ) {
      const existingUser =
        await User.findOne({
          username:
            username.toLowerCase(),
          _id: {
            $ne: user._id,
          },
        });

      if (existingUser) {
        throw new ApiError(
          409,
          "Username is already taken"
        );
      }

      user.username =
        username
          .toLowerCase()
          .trim();
    }

    if (fullname !== undefined) {
      user.fullname =
        fullname.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    if (avatar !== undefined) {
      user.avatar =
        avatar.trim();
    }

    await user.save();

    const updatedUser =
      await User.findById(
        user._id
      ).select(
        "-password -refreshToken"
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
        },
        "Profile updated successfully"
      )
    );
  }
);

const getUserProfile = asyncHandler(
  async (req, res) => {
    const { username } =
      req.params;

    const user =
      await User.findOne({
        username:
          username.toLowerCase(),
      }).select(
        "username fullname avatar bio role createdAt"
      );

    if (!user) {
      throw new ApiError(
        404,
        "User profile not found"
      );
    }

    const documents =
      await Document.find({
        createdBy: user._id,
        visibility: "public",
      })
        .select(
          "title description slug thumbnail category tags language views downloads createdAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          documents,
        },
        "User profile fetched successfully"
      )
    );
  }
);

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateProfile,
  getUserProfile,
};
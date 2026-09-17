import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { PendingRegistration } from "../models/pendingRegistration.model.js";
import { Document } from "../models/document.model.js";

import { sendEmail } from "../services/mail.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ======================================
// GENERATE TOKENS
// ======================================

const generateTokens = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;

  await user.save({
    validateBeforeSave: false,
  });

  return {
    accessToken,
    refreshToken,
  };
};

// ======================================
// COOKIE OPTIONS
// ======================================

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// ======================================
// REGISTER USER
// ======================================

const registerUser = asyncHandler(async (req, res) => {
  const {
    username,
    fullname,
    email,
    password,
  } = req.body;

  if (!username || !fullname || !email || !password) {
    throw new ApiError(
      400,
      "All fields are required"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { username: normalizedUsername },
    ],
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "User with this email or username already exists"
    );
  }

  const otp = crypto
    .randomInt(100000, 1000000)
    .toString();

  const otpHash = await bcrypt.hash(otp, 10);

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  try {
    await PendingRegistration.deleteMany({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    });

    await PendingRegistration.create({
      fullname: fullname.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      otpHash,
      attempts: 0,
      expiresAt,
    });

    await sendEmail({
      to: normalizedEmail,
      subject: "Verify your DocYard account",

      text: `Your DocYard verification code is ${otp}. This code expires in 10 minutes.`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
        ">

          <h2 style="margin-bottom: 10px;">
            Welcome to DocYard
          </h2>

          <p>
            Use the verification code below to verify
            your email address.
          </p>

          <div style="
            margin: 25px 0;
            padding: 18px;
            background: #f5f5f5;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
          ">
            ${otp}
          </div>

          <p>
            This code expires in
            <strong>10 minutes</strong>.
          </p>

          <p style="color: #666;">
            If you did not create a DocYard account,
            you can ignore this email.
          </p>

        </div>
      `,
    });
  } catch (error) {
    console.error(
      "EMAIL SENDING ERROR:",
      error
    );

    await PendingRegistration.deleteMany({
      email: normalizedEmail,
    });

    throw new ApiError(
      500,
      "Unable to send verification email. Please try again."
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        email: normalizedEmail,
      },
      "Verification OTP sent successfully"
    )
  );
});

// ======================================
// VERIFY REGISTRATION OTP
// ======================================

const verifyRegistrationOTP = asyncHandler(
  async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ApiError(
        400,
        "Email and OTP are required"
      );
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const pendingRegistration =
      await PendingRegistration.findOne({
        email: normalizedEmail,
      });

    if (!pendingRegistration) {
      throw new ApiError(
        404,
        "Registration not found or expired"
      );
    }

    if (
      pendingRegistration.expiresAt < new Date()
    ) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      throw new ApiError(
        400,
        "OTP has expired"
      );
    }

    if (pendingRegistration.attempts >= 5) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      throw new ApiError(
        429,
        "Too many incorrect attempts. Please register again."
      );
    }

    const isCorrect = await bcrypt.compare(
      otp.toString(),
      pendingRegistration.otpHash
    );

    if (!isCorrect) {
      pendingRegistration.attempts += 1;

      await pendingRegistration.save();

      throw new ApiError(
        400,
        "Invalid OTP"
      );
    }

    const existingUser = await User.findOne({
      $or: [
        {
          email: pendingRegistration.email,
        },
        {
          username: pendingRegistration.username,
        },
      ],
    });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      throw new ApiError(
        409,
        "User with this email or username already exists"
      );
    }

    const user = await User.create({
      fullname: pendingRegistration.fullname,
      username: pendingRegistration.username,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      isVerified: true,
    });

    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          email: user.email,
          verified: true,
        },
        "Email verified successfully"
      )
    );
  }
);

// ======================================
// LOGIN USER
// ======================================

const loginUser = asyncHandler(async (req, res) => {
  const {
    email,
    password,
  } = req.body;

  if (!email || !password) {
    throw new ApiError(
      400,
      "Email and password are required"
    );
  }

  const normalizedEmail =
    email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email before logging in"
    );
  }

  const isPasswordCorrect =
    await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(
      401,
      "Invalid email or password"
    );
  }

  const {
    accessToken,
    refreshToken,
  } = await generateTokens(user._id);

  user.lastLogin = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  const loggedInUser =
    await User.findById(user._id).select(
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
});

// ======================================
// LOGOUT USER
// ======================================

const logoutUser = asyncHandler(async (req, res) => {
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
});

// ======================================
// REFRESH ACCESS TOKEN
// ======================================

const refreshAccessToken = asyncHandler(
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
      decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch {
      throw new ApiError(
        401,
        "Invalid or expired refresh token"
      );
    }

    const user = await User.findById(
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

    user.refreshToken = refreshToken;

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

// ======================================
// GET CURRENT USER
// ======================================

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
        {
          user,
        },
        "Current user fetched successfully"
      )
    );
  }
);

// ======================================
// CHANGE PASSWORD
// ======================================

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

// ======================================
// UPDATE PROFILE
// ======================================

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

// ======================================
// GET PUBLIC USER PROFILE
// ======================================

const getUserProfile = asyncHandler(
  async (req, res) => {
    const { username } = req.params;

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

// ======================================
// EXPORTS
// ======================================

export {
  registerUser,
  verifyRegistrationOTP,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateProfile,
  getUserProfile,
};
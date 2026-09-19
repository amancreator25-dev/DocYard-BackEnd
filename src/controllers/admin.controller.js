import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { Document } from "../models/document.model.js";
import { Like } from "../models/like.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { Comment } from "../models/comment.model.js";
import { Contact } from "../models/contact.model.js";
import { OTP } from "../models/otp.model.js";

import { deleteFromCloudinary } from "../config/cloudinary.js";
import { sendEmail } from "../services/mail.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ======================================
// ADMIN LOGIN OTP
// ======================================

const sendAdminLoginOTP = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(
      400,
      "Email and password are required"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

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

  if (user.role !== "admin") {
    throw new ApiError(
      403,
      "Admin access required"
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

  const otp = crypto
    .randomInt(100000, 1000000)
    .toString();

  const otpHash = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await OTP.deleteMany({
    email: normalizedEmail,
    purpose: "admin-login",
  });

  await OTP.create({
    email: normalizedEmail,
    otpHash,
    purpose: "admin-login",
    attempts: 0,
    expiresAt,
  });

  const adminLoginToken = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      purpose: "admin-login",
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "10m",
    }
  );

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: "Your DocYard admin verification code",

      text: `Your DocYard admin verification code is ${otp}. This code expires in 10 minutes.`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
        ">

          <h2>DocYard Admin Verification</h2>

          <p>
            Use the verification code below to access
            the DocYard administrator area.
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

          <p style="color:#666;">
            If you did not attempt to access the
            DocYard admin area, you can ignore this email.
          </p>

        </div>
      `,
    });
  } catch (error) {
    console.error(
      "ADMIN OTP EMAIL ERROR:",
      error
    );

    await OTP.deleteMany({
      email: normalizedEmail,
      purpose: "admin-login",
    });

    throw new ApiError(
      500,
      "Unable to send admin verification email. Please try again."
    );
  }

  return res
    .status(200)
    .cookie(
      "adminLoginToken",
      adminLoginToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 10 * 60 * 1000,
      }
    )
    .json(
      new ApiResponse(
        200,
        {
          requiresAdminOTP: true,
          email: normalizedEmail,
        },
        "Admin verification OTP sent successfully"
      )
    );
});

// ======================================
// VERIFY ADMIN OTP
// ======================================

const verifyAdminOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(
      400,
      "Email and OTP are required"
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const adminLoginToken =
    req.cookies?.adminLoginToken;

  if (!adminLoginToken) {
    throw new ApiError(
      401,
      "Admin login session expired. Please login again."
    );
  }

  let decodedToken;

  try {
    decodedToken = jwt.verify(
      adminLoginToken,
      process.env.ACCESS_TOKEN_SECRET
    );
  } catch {
    throw new ApiError(
      401,
      "Admin login session expired. Please login again."
    );
  }

  if (
    decodedToken?.purpose !== "admin-login" ||
    !decodedToken?._id
  ) {
    throw new ApiError(
      401,
      "Invalid admin login session"
    );
  }

  const user = await User.findById(
    decodedToken._id
  ).select("+refreshToken");

  if (!user) {
    throw new ApiError(
      404,
      "User not found"
    );
  }

  if (user.email !== normalizedEmail) {
    throw new ApiError(
      401,
      "Invalid admin login session"
    );
  }

  if (user.role !== "admin") {
    throw new ApiError(
      403,
      "Admin access required"
    );
  }

  const otpRecord = await OTP.findOne({
    email: normalizedEmail,
    purpose: "admin-login",
  });

  if (!otpRecord) {
    throw new ApiError(
      400,
      "OTP is invalid or expired"
    );
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    throw new ApiError(
      400,
      "OTP has expired"
    );
  }

  if (otpRecord.attempts >= 5) {
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    throw new ApiError(
      429,
      "Too many incorrect attempts. Please login again."
    );
  }

  const isCorrect = await bcrypt.compare(
    otp.toString(),
    otpRecord.otpHash
  );

  if (!isCorrect) {
    otpRecord.attempts += 1;

    await otpRecord.save();

    throw new ApiError(
      400,
      "Invalid OTP"
    );
  }

  const accessToken =
    user.generateAccessToken();

  const refreshToken =
    user.generateRefreshToken();

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  await OTP.deleteOne({
    _id: otpRecord._id,
  });

  const loggedInUser =
    await User.findById(user._id).select(
      "-password -refreshToken"
    );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie(
      "adminLoginToken",
      cookieOptions
    )
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
        "Admin login successful"
      )
    );
});

// ======================================
// ADMIN DASHBOARD
// ======================================

const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDocuments,
    totalLikes,
    totalBookmarks,
    totalComments,
    totalContacts,
    publicDocuments,
    privateDocuments,
  ] = await Promise.all([
    User.countDocuments(),
    Document.countDocuments(),
    Like.countDocuments(),
    Bookmark.countDocuments(),
    Comment.countDocuments(),
    Contact.countDocuments(),
    Document.countDocuments({
      visibility: "public",
    }),
    Document.countDocuments({
      visibility: "private",
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        statistics: {
          totalUsers,
          totalDocuments,
          totalLikes,
          totalBookmarks,
          totalComments,
          totalContacts,
          publicDocuments,
          privateDocuments,
        },
      },
      "Admin dashboard fetched successfully"
    )
  );
});

// ======================================
// GET ALL USERS
// ======================================

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select(
      "username fullname email avatar bio role isVerified createdAt lastLogin"
    )
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: users.length,
        users,
      },
      "Users fetched successfully"
    )
  );
});

// ======================================
// GET USER BY ID
// ======================================

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select(
    "username fullname email avatar bio role isVerified createdAt lastLogin"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      "User fetched successfully"
    )
  );
});

// ======================================
// UPDATE USER ROLE
// ======================================

const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!["user", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  if (req.user._id.toString() === userId) {
    throw new ApiError(
      400,
      "You cannot change your own role"
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.role = role;

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        username: user.username,
        role: user.role,
      },
      "User role updated successfully"
    )
  );
});

// ======================================
// DELETE USER
// ======================================

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (req.user._id.toString() === userId) {
    throw new ApiError(
      400,
      "You cannot delete your own account"
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const documents = await Document.find({
    createdBy: userId,
  }).select("publicId");

  const cloudinaryDeletePromises = documents
    .filter((document) => document.publicId)
    .map((document) =>
      deleteFromCloudinary(document.publicId)
    );

  await Promise.all(cloudinaryDeletePromises);

  await Promise.all([
    Document.deleteMany({
      createdBy: userId,
    }),

    Like.deleteMany({
      user: userId,
    }),

    Bookmark.deleteMany({
      user: userId,
    }),

    Comment.deleteMany({
      user: userId,
    }),

    Contact.deleteMany({
      user: userId,
    }),

    User.findByIdAndDelete(userId),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "User and related data deleted successfully"
    )
  );
});

// ======================================
// GET ALL DOCUMENTS FOR ADMIN
// SUPPORTS PUBLIC / PRIVATE FILTER
// ======================================

const getAllDocumentsAdmin = asyncHandler(
  async (req, res) => {
    const { visibility } = req.query;

    const filter = {};

    if (
      visibility &&
      ["public", "private"].includes(visibility)
    ) {
      filter.visibility = visibility;
    }

    const documents = await Document.find(filter)
      .populate(
        "createdBy",
        "username fullname email"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: documents.length,
          documents,
          visibility: visibility || "all",
        },
        "Documents fetched successfully"
      )
    );
  }
);

// ======================================
// DELETE DOCUMENT BY ADMIN
// ======================================

const adminDeleteDocument = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;

    const document = await Document.findById(
      documentId
    );

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (document.publicId) {
      await deleteFromCloudinary(
        document.publicId
      );
    }

    await Promise.all([
      Like.deleteMany({
        document: documentId,
      }),

      Bookmark.deleteMany({
        document: documentId,
      }),

      Comment.deleteMany({
        document: documentId,
      }),

      Document.findByIdAndDelete(
        documentId
      ),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Document deleted successfully by admin"
      )
    );
  }
);

// ======================================
// CONTACT STATISTICS
// ======================================

const getContactStatistics = asyncHandler(
  async (req, res) => {
    const [
      pending,
      inProgress,
      resolved,
    ] = await Promise.all([
      Contact.countDocuments({
        status: "pending",
      }),

      Contact.countDocuments({
        status: "in-progress",
      }),

      Contact.countDocuments({
        status: "resolved",
      }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          statistics: {
            pending,
            inProgress,
            resolved,
            total:
              pending +
              inProgress +
              resolved,
          },
        },
        "Contact statistics fetched successfully"
      )
    );
  }
);

export {
  sendAdminLoginOTP,
  verifyAdminOTP,

  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllDocumentsAdmin,
  adminDeleteDocument,
  getContactStatistics,
};
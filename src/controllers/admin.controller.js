import { User } from "../models/user.model.js";
import { Document } from "../models/document.model.js";
import { Like } from "../models/like.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { Comment } from "../models/comment.model.js";
import { Contact } from "../models/contact.model.js";

import {
  deleteFromCloudinary,
} from "../config/cloudinary.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAdminDashboard = asyncHandler(
  async (req, res) => {
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
  }
);

const getAllUsers = asyncHandler(
  async (req, res) => {
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
  }
);

const getUserById = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(
      userId
    ).select(
      "username fullname email avatar bio role isVerified createdAt lastLogin"
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
        user,
        "User fetched successfully"
      )
    );
  }
);

const updateUserRole = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      throw new ApiError(
        400,
        "Invalid role"
      );
    }

    if (
      req.user._id.toString() === userId
    ) {
      throw new ApiError(
        400,
        "You cannot change your own role"
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
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
  }
);

const deleteUser = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;

    if (
      req.user._id.toString() === userId
    ) {
      throw new ApiError(
        400,
        "You cannot delete your own account"
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(
        404,
        "User not found"
      );
    }

    const documents = await Document.find({
      createdBy: userId,
    }).select("publicId");

    const cloudinaryDeletePromises =
      documents
        .filter(
          (document) => document.publicId
        )
        .map((document) =>
          deleteFromCloudinary(
            document.publicId
          )
        );

    await Promise.all(
      cloudinaryDeletePromises
    );

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
  }
);

const getAllDocumentsAdmin =
  asyncHandler(
    async (req, res) => {
      const documents =
        await Document.find()
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
          },
          "Documents fetched successfully"
        )
      );
    }
  );

const adminDeleteDocument =
  asyncHandler(
    async (req, res) => {
      const { documentId } =
        req.params;

      const document =
        await Document.findById(
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

const getContactStatistics =
  asyncHandler(
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
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllDocumentsAdmin,
  adminDeleteDocument,
  getContactStatistics,
};
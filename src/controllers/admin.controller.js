import { User } from "../models/user.model.js";
import { Document } from "../models/document.model.js";
import { Like } from "../models/like.model.js";
import { Bookmark } from "../models/bookmark.model.js";
import { Comment } from "../models/comment.model.js";
import { Contact } from "../models/contact.model.js";

// ======================================
// GET ADMIN DASHBOARD
// ======================================
const getAdminDashboard = async (req, res) => {
  try {
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

    return res.status(200).json({
      success: true,
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
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching dashboard",
      error: error.message,
    });
  }
};


// ======================================
// GET ALL USERS
// ======================================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "username fullname email avatar bio role isVerified createdAt lastLogin"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching users",
      error: error.message,
    });
  }
};


// ======================================
// GET USER BY ID
// ======================================
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select(
        "username fullname email avatar bio role isVerified createdAt lastLogin"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching user",
      error: error.message,
    });
  }
};


// ======================================
// UPDATE USER ROLE
// ======================================
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update User Role Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating user role",
      error: error.message,
    });
  }
};


// ======================================
// DELETE USER
// ======================================
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user's related data
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

    return res.status(200).json({
      success: true,
      message: "User and related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting user",
      error: error.message,
    });
  }
};


// ======================================
// GET ALL DOCUMENTS
// ======================================
const getAllDocumentsAdmin = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate(
        "createdBy",
        "username fullname email"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Admin Get Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching documents",
      error: error.message,
    });
  }
};


// ======================================
// DELETE DOCUMENT
// ======================================
const adminDeleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete related data
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

      Document.findByIdAndDelete(documentId),
    ]);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully by admin",
    });
  } catch (error) {
    console.error("Admin Delete Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting document",
      error: error.message,
    });
  }
};


// ======================================
// GET CONTACT STATISTICS
// ======================================
const getContactStatistics = async (req, res) => {
  try {
    const [pending, inProgress, resolved] =
      await Promise.all([
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

    return res.status(200).json({
      success: true,
      statistics: {
        pending,
        inProgress,
        resolved,
        total: pending + inProgress + resolved,
      },
    });
  } catch (error) {
    console.error(
      "Contact Statistics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching contact statistics",
      error: error.message,
    });
  }
};


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
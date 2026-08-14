import { Like } from "../models/like.model.js";
import { Document } from "../models/document.model.js";

// ======================================
// LIKE DOCUMENT
// ======================================
const likeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    // Check if document exists
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      user: userId,
      document: documentId,
    });

    if (existingLike) {
      return res.status(409).json({
        success: false,
        message: "Document already liked",
      });
    }

    // Create like
    const like = await Like.create({
      user: userId,
      document: documentId,
    });

    return res.status(201).json({
      success: true,
      message: "Document liked successfully",
      like,
    });
  } catch (error) {
    console.error("Like Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while liking document",
      error: error.message,
    });
  }
};


// ======================================
// UNLIKE DOCUMENT
// ======================================
const unlikeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const like = await Like.findOneAndDelete({
      user: userId,
      document: documentId,
    });

    if (!like) {
      return res.status(404).json({
        success: false,
        message: "You have not liked this document",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Document unliked successfully",
    });
  } catch (error) {
    console.error("Unlike Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while unliking document",
      error: error.message,
    });
  }
};


// ======================================
// CHECK LIKE STATUS
// ======================================
const checkLikeStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const like = await Like.findOne({
      user: userId,
      document: documentId,
    });

    return res.status(200).json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    console.error("Check Like Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking like status",
      error: error.message,
    });
  }
};


// ======================================
// GET LIKE COUNT
// ======================================
const getLikeCount = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Check document
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const likeCount = await Like.countDocuments({
      document: documentId,
    });

    return res.status(200).json({
      success: true,
      likeCount,
    });
  } catch (error) {
    console.error("Get Like Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while getting like count",
      error: error.message,
    });
  }
};


export {
  likeDocument,
  unlikeDocument,
  checkLikeStatus,
  getLikeCount,
};
import { Bookmark } from "../models/bookmark.model.js";
import { Document } from "../models/document.model.js";

// ======================================
// ADD BOOKMARK
// ======================================
const addBookmark = async (req, res) => {
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

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      user: userId,
      document: documentId,
    });

    if (existingBookmark) {
      return res.status(409).json({
        success: false,
        message: "Document already bookmarked",
      });
    }

    // Create bookmark
    const bookmark = await Bookmark.create({
      user: userId,
      document: documentId,
    });

    return res.status(201).json({
      success: true,
      message: "Document bookmarked successfully",
      bookmark,
    });
  } catch (error) {
    console.error("Add Bookmark Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while bookmarking document",
      error: error.message,
    });
  }
};


// ======================================
// REMOVE BOOKMARK
// ======================================
const removeBookmark = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOneAndDelete({
      user: userId,
      document: documentId,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: "Document is not bookmarked",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Remove Bookmark Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while removing bookmark",
      error: error.message,
    });
  }
};


// ======================================
// CHECK BOOKMARK STATUS
// ======================================
const checkBookmarkStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;

    const bookmark = await Bookmark.findOne({
      user: userId,
      document: documentId,
    });

    return res.status(200).json({
      success: true,
      bookmarked: !!bookmark,
    });
  } catch (error) {
    console.error("Check Bookmark Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking bookmark status",
      error: error.message,
    });
  }
};


// ======================================
// GET MY BOOKMARKS
// ======================================
const getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      user: req.user._id,
    })
      .populate({
        path: "document",
        populate: {
          path: "createdBy",
          select: "username fullname avatar",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookmarks.length,
      bookmarks,
    });
  } catch (error) {
    console.error("Get My Bookmarks Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching bookmarks",
      error: error.message,
    });
  }
};


export {
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getMyBookmarks,
};
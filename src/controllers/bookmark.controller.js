import { Bookmark } from "../models/bookmark.model.js";
import { Document } from "../models/document.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addBookmark = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user._id;

    const document =
      await Document.findById(documentId);

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    const existingBookmark =
      await Bookmark.findOne({
        user: userId,
        document: documentId,
      });

    if (existingBookmark) {
      throw new ApiError(
        409,
        "Document already bookmarked"
      );
    }

    const bookmark = await Bookmark.create({
      user: userId,
      document: documentId,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { bookmark },
        "Document bookmarked successfully"
      )
    );
  }
);

const removeBookmark = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user._id;

    const bookmark =
      await Bookmark.findOneAndDelete({
        user: userId,
        document: documentId,
      });

    if (!bookmark) {
      throw new ApiError(
        404,
        "Document is not bookmarked"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Bookmark removed successfully"
      )
    );
  }
);

const checkBookmarkStatus = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user._id;

    const bookmark =
      await Bookmark.findOne({
        user: userId,
        document: documentId,
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          bookmarked: !!bookmark,
        },
        "Bookmark status fetched successfully"
      )
    );
  }
);

const getMyBookmarks = asyncHandler(
  async (req, res) => {
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

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: bookmarks.length,
          bookmarks,
        },
        "Bookmarks fetched successfully"
      )
    );
  }
);

export {
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getMyBookmarks,
};
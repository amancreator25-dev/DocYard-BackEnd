import { Like } from "../models/like.model.js";
import { Document } from "../models/document.model.js";

import  asyncHandler  from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";

const likeDocument = asyncHandler(
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

    const existingLike =
      await Like.findOne({
        user: userId,
        document: documentId,
      });

    if (existingLike) {
      throw new ApiError(
        409,
        "Document already liked"
      );
    }

    const like = await Like.create({
      user: userId,
      document: documentId,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { like },
        "Document liked successfully"
      )
    );
  }
);

const unlikeDocument = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user._id;

    const like =
      await Like.findOneAndDelete({
        user: userId,
        document: documentId,
      });

    if (!like) {
      throw new ApiError(
        404,
        "You have not liked this document"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Document unliked successfully"
      )
    );
  }
);

const checkLikeStatus = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;
    const userId = req.user._id;

    const like = await Like.findOne({
      user: userId,
      document: documentId,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          liked: !!like,
        },
        "Like status fetched successfully"
      )
    );
  }
);

const getLikeCount = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;

    const document =
      await Document.findById(documentId);

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    const likeCount =
      await Like.countDocuments({
        document: documentId,
      });

    return res.status(200).json(
      new ApiResponse(
        200,
        { likeCount },
        "Like count fetched successfully"
      )
    );
  }
);

export {
  likeDocument,
  unlikeDocument,
  checkLikeStatus,
  getLikeCount,
};
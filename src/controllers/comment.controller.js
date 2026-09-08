import { Comment } from "../models/comment.model.js";
import { Document } from "../models/document.model.js";

import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";

const addComment = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;
    const { content, parentComment } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      throw new ApiError(
        400,
        "Comment cannot be empty"
      );
    }

    const document =
      await Document.findById(documentId);

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (parentComment) {
      const parent =
        await Comment.findOne({
          _id: parentComment,
          document: documentId,
        });

      if (!parent) {
        throw new ApiError(
          404,
          "Parent comment not found"
        );
      }
    }

    const comment = await Comment.create({
      user: userId,
      document: documentId,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    const populatedComment =
      await Comment.findById(comment._id)
        .populate(
          "user",
          "username fullname avatar"
        );

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          comment: populatedComment,
        },
        parentComment
          ? "Reply added successfully"
          : "Comment added successfully"
      )
    );
  }
);

const getDocumentComments = asyncHandler(
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

    const comments = await Comment.find({
      document: documentId,
    })
      .populate(
        "user",
        "username fullname avatar"
      )
      .sort({ createdAt: 1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: comments.length,
          comments,
        },
        "Comments fetched successfully"
      )
    );
  }
);

const updateComment = asyncHandler(
  async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new ApiError(
        400,
        "Comment cannot be empty"
      );
    }

    const comment =
      await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(
        404,
        "Comment not found"
      );
    }

    if (
      comment.user.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to edit this comment"
      );
    }

    comment.content = content.trim();
    comment.isEdited = true;

    await comment.save();

    const updatedComment =
      await Comment.findById(comment._id)
        .populate(
          "user",
          "username fullname avatar"
        );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          comment: updatedComment,
        },
        "Comment updated successfully"
      )
    );
  }
);

const deleteComment = asyncHandler(
  async (req, res) => {
    const { commentId } = req.params;

    const comment =
      await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(
        404,
        "Comment not found"
      );
    }

    if (
      comment.user.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to delete this comment"
      );
    }

    await Comment.deleteMany({
      parentComment: commentId,
    });

    await Comment.findByIdAndDelete(
      commentId
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Comment deleted successfully"
      )
    );
  }
);

export {
  addComment,
  getDocumentComments,
  updateComment,
  deleteComment,
};
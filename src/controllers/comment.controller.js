import { Comment } from "../models/comment.model.js";
import { Document } from "../models/document.model.js";

// ======================================
// ADD COMMENT
// ======================================
const addComment = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content, parentComment } = req.body;
    const userId = req.user._id;

    // Validate content
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    // Check document
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // If this is a reply, check parent comment
    if (parentComment) {
      const parent = await Comment.findOne({
        _id: parentComment,
        document: documentId,
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    }

    // Create comment
    const comment = await Comment.create({
      user: userId,
      document: documentId,
      content: content.trim(),
      parentComment: parentComment || null,
    });

    // Populate user information
    const populatedComment = await Comment.findById(comment._id)
      .populate("user", "username fullname avatar");

    return res.status(201).json({
      success: true,
      message: parentComment
        ? "Reply added successfully"
        : "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Add Comment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding comment",
      error: error.message,
    });
  }
};


// ======================================
// GET DOCUMENT COMMENTS
// ======================================
const getDocumentComments = async (req, res) => {
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

    const comments = await Comment.find({
      document: documentId,
    })
      .populate("user", "username fullname avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get Comments Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching comments",
      error: error.message,
    });
  }
};


// ======================================
// UPDATE COMMENT
// ======================================
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check ownership
    if (
      comment.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this comment",
      });
    }

    comment.content = content.trim();
    comment.isEdited = true;

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("user", "username fullname avatar");

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update Comment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating comment",
      error: error.message,
    });
  }
};


// ======================================
// DELETE COMMENT
// ======================================
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check ownership
    if (
      comment.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment",
      });
    }

    // Delete replies as well
    await Comment.deleteMany({
      parentComment: commentId,
    });

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Comment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting comment",
      error: error.message,
    });
  }
};


export {
  addComment,
  getDocumentComments,
  updateComment,
  deleteComment,
};
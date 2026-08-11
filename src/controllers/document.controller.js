import { Document } from "../models/document.model.js";

// ======================================
// CREATE DOCUMENT
// ======================================
const createDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      author,
      slug,
      fileUrl,
      thumbnail,
      fileType,
      fileSize,
      category,
      tags,
      language,
      visibility,
    } = req.body;

    // Required fields
    if (
      !title ||
      !description ||
      !author ||
      !slug ||
      !fileUrl ||
      !fileType ||
      !fileSize ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Required document fields are missing",
      });
    }

    // Check slug
    const existingDocument = await Document.findOne({ slug });

    if (existingDocument) {
      return res.status(409).json({
        success: false,
        message: "A document with this slug already exists",
      });
    }

    // Create document
    const document = await Document.create({
      title,
      description,
      author,
      slug,
      fileUrl,
      thumbnail: thumbnail || "",
      fileType,
      fileSize,
      category,
      tags: tags || [],
      language: language || "English",
      visibility: visibility || "public",

      // Logged-in user
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      document,
    });
  } catch (error) {
    console.error("Create Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating document",
      error: error.message,
    });
  }
};


// ======================================
// GET ALL PUBLIC DOCUMENTS
// ======================================
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      visibility: "public",
    })
      .populate("createdBy", "username fullname avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching documents",
      error: error.message,
    });
  }
};


// ======================================
// GET DOCUMENT BY SLUG
// ======================================
const getDocumentBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const document = await Document.findOne({ slug })
      .populate("createdBy", "username fullname avatar");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Private document
    if (document.visibility === "private") {
      // User must be logged in
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: "This document is private",
        });
      }

      // Only owner can access
      if (
        document.createdBy._id.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to access this document",
        });
      }
    }

    // Increase view count
    document.views += 1;
    await document.save();

    return res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("Get Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching document",
      error: error.message,
    });
  }
};


// ======================================
// GET MY DOCUMENTS
// ======================================
const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get My Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching your documents",
      error: error.message,
    });
  }
};


// ======================================
// UPDATE DOCUMENT
// ======================================
const updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership
    if (
      document.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this document",
      });
    }

    const {
      title,
      description,
      author,
      slug,
      thumbnail,
      category,
      tags,
      language,
      visibility,
    } = req.body;

    // If slug is being changed, check uniqueness
    if (slug && slug !== document.slug) {
      const existingDocument = await Document.findOne({ slug });

      if (existingDocument) {
        return res.status(409).json({
          success: false,
          message: "This slug is already being used",
        });
      }

      document.slug = slug;
    }

    // Update only provided fields
    if (title !== undefined) {
      document.title = title;
    }

    if (description !== undefined) {
      document.description = description;
    }

    if (author !== undefined) {
      document.author = author;
    }

    if (thumbnail !== undefined) {
      document.thumbnail = thumbnail;
    }

    if (category !== undefined) {
      document.category = category;
    }

    if (tags !== undefined) {
      document.tags = tags;
    }

    if (language !== undefined) {
      document.language = language;
    }

    if (visibility !== undefined) {
      document.visibility = visibility;
    }

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    console.error("Update Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating document",
      error: error.message,
    });
  }
};


// ======================================
// DELETE DOCUMENT
// ======================================
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check ownership
    if (
      document.createdBy.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this document",
      });
    }

    await Document.findByIdAndDelete(documentId);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting document",
      error: error.message,
    });
  }
};


// ======================================
// DOWNLOAD DOCUMENT
// ======================================
const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Private document
    if (document.visibility === "private") {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: "This document is private",
        });
      }

      if (
        document.createdBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to download this document",
        });
      }
    }

    // Increase download count
    document.downloads += 1;
    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document download started",
      fileUrl: document.fileUrl,
    });
  } catch (error) {
    console.error("Download Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while downloading document",
      error: error.message,
    });
  }
};


// ======================================
// EXPORT
// ======================================
export {
  createDocument,
  getAllDocuments,
  getDocumentBySlug,
  getMyDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
};
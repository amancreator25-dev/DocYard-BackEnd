import { Document } from "../models/document.model.js";
import fs from "fs";
import path from "path";

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
      category,
      tags,
      language,
      visibility,
    } = req.body;

    // Check uploaded file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    // Required fields
    if (
      !title ||
      !description ||
      !author ||
      !slug ||
      !category
    ) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Required document fields are missing",
      });
    }

    // Check slug
    const existingDocument = await Document.findOne({
      slug: slug.toLowerCase(),
    });

    if (existingDocument) {
      fs.unlinkSync(req.file.path);

      return res.status(409).json({
        success: false,
        message: "A document with this slug already exists",
      });
    }

    // Determine file type
    const extension = path
      .extname(req.file.originalname)
      .toLowerCase()
      .replace(".", "");

    // Create document
    const document = await Document.create({
      title: title.trim(),

      description: description.trim(),

      author: author.trim(),

      slug: slug.trim().toLowerCase(),

      fileUrl: `/uploads/documents/${req.file.filename}`,

      fileType: extension,

      fileSize: req.file.size,

      category: category.trim(),

      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim().toLowerCase())
        : [],

      language: language || "English",

      visibility: visibility || "public",

      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Document created successfully",
      document,
    });
  } catch (error) {
    console.error("Create Document Error:", error);

    // Delete uploaded file if database operation fails
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

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
      .populate(
        "createdBy",
        "username fullname avatar"
      )
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

    const document = await Document.findOne({
      slug: slug.toLowerCase(),
    }).populate(
      "createdBy",
      "username fullname avatar"
    );

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
        document.createdBy._id.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to access this document",
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
      message:
        "Something went wrong while fetching document",
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
    console.error(
      "Get My Documents Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching your documents",
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

    const document = await Document.findById(
      documentId
    );

    if (!document) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

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
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to update this document",
      });
    }

    const {
      title,
      description,
      author,
      slug,
      category,
      tags,
      language,
      visibility,
    } = req.body;

    // Check slug uniqueness
    if (slug && slug !== document.slug) {
      const existingDocument = await Document.findOne({
        slug: slug.toLowerCase(),
        _id: { $ne: documentId },
      });

      if (existingDocument) {
        if (
          req.file?.path &&
          fs.existsSync(req.file.path)
        ) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(409).json({
          success: false,
          message: "This slug is already being used",
        });
      }

      document.slug = slug.trim().toLowerCase();
    }

    // Update fields
    if (title !== undefined) {
      document.title = title.trim();
    }

    if (description !== undefined) {
      document.description = description.trim();
    }

    if (author !== undefined) {
      document.author = author.trim();
    }

    if (category !== undefined) {
      document.category = category.trim();
    }

    if (tags !== undefined) {
      document.tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((tag) =>
              tag.trim().toLowerCase()
            );
    }

    if (language !== undefined) {
      document.language = language;
    }

    if (visibility !== undefined) {
      document.visibility = visibility;
    }

    // --------------------------------------
    // Replace uploaded file
    // --------------------------------------

    if (req.file) {
      const extension = path
        .extname(req.file.originalname)
        .toLowerCase()
        .replace(".", "");

      const oldFileUrl = document.fileUrl;

      document.fileUrl =
        `/uploads/documents/${req.file.filename}`;

      document.fileType = extension;

      document.fileSize = req.file.size;

      // Delete old file
      if (oldFileUrl) {
        const oldFilePath = path.join(
          process.cwd(),
          oldFileUrl
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document,
    });
  } catch (error) {
    console.error(
      "Update Document Error:",
      error
    );

    if (
      req.file?.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating document",
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

    const document = await Document.findById(
      documentId
    );

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
        message:
          "You are not allowed to delete this document",
      });
    }

    // Delete physical file
    if (document.fileUrl) {
      const filePath = path.join(
        process.cwd(),
        document.fileUrl
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Document.findByIdAndDelete(
      documentId
    );

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Document Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting document",
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

    const document = await Document.findById(
      documentId
    );

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
          message:
            "You are not allowed to download this document",
        });
      }
    }

    // Increase downloads
    document.downloads += 1;

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document download started",
      fileUrl: document.fileUrl,
    });
  } catch (error) {
    console.error(
      "Download Document Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while downloading document",
      error: error.message,
    });
  }
};


export {
  createDocument,
  getAllDocuments,
  getDocumentBySlug,
  getMyDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
};
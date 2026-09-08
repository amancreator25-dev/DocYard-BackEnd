import { Document } from "../models/document.model.js";

import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

import {
  getFileExtension,
  deleteLocalFile,
} from "../utils/file.utils.js";

import  asyncHandler  from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import  ApiResponse  from "../utils/ApiResponse.js";

const createDocument = asyncHandler(
  async (req, res) => {
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

    if (!req.file) {
      throw new ApiError(
        400,
        "Document file is required"
      );
    }

    if (
      !title ||
      !description ||
      !author ||
      !slug ||
      !category
    ) {
      deleteLocalFile(req.file.path);

      throw new ApiError(
        400,
        "Required document fields are missing"
      );
    }

    const existingDocument =
      await Document.findOne({
        slug: slug.toLowerCase(),
      });

    if (existingDocument) {
      deleteLocalFile(req.file.path);

      throw new ApiError(
        409,
        "A document with this slug already exists"
      );
    }

    let cloudinaryResult;

    try {
      cloudinaryResult =
        await uploadToCloudinary(
          req.file.path,
          "docyard/documents"
        );
    } catch (error) {
      deleteLocalFile(req.file.path);
      throw error;
    }

    deleteLocalFile(req.file.path);

    const extension = getFileExtension(
      req.file.originalname
    );

    const document = await Document.create({
      title: title.trim(),
      description: description.trim(),
      author: author.trim(),
      slug: slug.trim().toLowerCase(),
      fileUrl: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      fileType: extension,
      fileSize: req.file.size,
      category: category.trim(),
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags
              .split(",")
              .map((tag) =>
                tag.trim().toLowerCase()
              )
        : [],
      language: language || "English",
      visibility: visibility || "public",
      createdBy: req.user._id,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        document,
        "Document created successfully"
      )
    );
  }
);

const getAllDocuments = asyncHandler(
  async (req, res) => {
    const documents = await Document.find({
      visibility: "public",
    })
      .populate(
        "createdBy",
        "username fullname avatar"
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

const getDocumentBySlug = asyncHandler(
  async (req, res) => {
    const { slug } = req.params;

    const document = await Document.findOne({
      slug: slug.toLowerCase(),
    }).populate(
      "createdBy",
      "username fullname avatar"
    );

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (document.visibility === "private") {
      if (!req.user) {
        throw new ApiError(
          403,
          "This document is private"
        );
      }

      if (
        document.createdBy._id.toString() !==
        req.user._id.toString()
      ) {
        throw new ApiError(
          403,
          "You are not allowed to access this document"
        );
      }
    }

    document.views += 1;

    await document.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        document,
        "Document fetched successfully"
      )
    );
  }
);

const getMyDocuments = asyncHandler(
  async (req, res) => {
    const documents = await Document.find({
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: documents.length,
          documents,
        },
        "Your documents fetched successfully"
      )
    );
  }
);

const updateDocument = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;

    const document = await Document.findById(
      documentId
    );

    if (!document) {
      deleteLocalFile(req.file?.path);

      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (
      document.createdBy.toString() !==
      req.user._id.toString()
    ) {
      deleteLocalFile(req.file?.path);

      throw new ApiError(
        403,
        "You are not allowed to update this document"
      );
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

    if (slug && slug !== document.slug) {
      const existingDocument =
        await Document.findOne({
          slug: slug.toLowerCase(),
          _id: { $ne: documentId },
        });

      if (existingDocument) {
        deleteLocalFile(req.file?.path);

        throw new ApiError(
          409,
          "This slug is already being used"
        );
      }

      document.slug =
        slug.trim().toLowerCase();
    }

    if (title !== undefined) {
      document.title = title.trim();
    }

    if (description !== undefined) {
      document.description =
        description.trim();
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

    if (req.file) {
      let cloudinaryResult;

      try {
        cloudinaryResult =
          await uploadToCloudinary(
            req.file.path,
            "docyard/documents"
          );
      } catch (error) {
        deleteLocalFile(req.file.path);
        throw error;
      }

      deleteLocalFile(req.file.path);

      if (document.publicId) {
        await deleteFromCloudinary(
          document.publicId
        );
      }

      document.fileUrl =
        cloudinaryResult.secure_url;

      document.publicId =
        cloudinaryResult.public_id;

      document.fileType =
        getFileExtension(
          req.file.originalname
        );

      document.fileSize = req.file.size;
    }

    await document.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        document,
        "Document updated successfully"
      )
    );
  }
);

const deleteDocument = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;

    const document = await Document.findById(
      documentId
    );

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (
      document.createdBy.toString() !==
      req.user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You are not allowed to delete this document"
      );
    }

    if (document.publicId) {
      await deleteFromCloudinary(
        document.publicId
      );
    }

    await Document.findByIdAndDelete(
      documentId
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Document deleted successfully"
      )
    );
  }
);

const downloadDocument = asyncHandler(
  async (req, res) => {
    const { documentId } = req.params;

    const document = await Document.findById(
      documentId
    );

    if (!document) {
      throw new ApiError(
        404,
        "Document not found"
      );
    }

    if (document.visibility === "private") {
      if (!req.user) {
        throw new ApiError(
          403,
          "This document is private"
        );
      }

      if (
        document.createdBy.toString() !==
        req.user._id.toString()
      ) {
        throw new ApiError(
          403,
          "You are not allowed to download this document"
        );
      }
    }

    document.downloads += 1;

    await document.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          fileUrl: document.fileUrl,
        },
        "Document download started"
      )
    );
  }
);

export {
  createDocument,
  getAllDocuments,
  getDocumentBySlug,
  getMyDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
};
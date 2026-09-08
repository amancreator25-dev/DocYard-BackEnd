import { Document } from "../models/document.model.js";

import {
  generateSummary,
  translateDocument,
} from "../services/ai.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const summarizeDocument = asyncHandler(
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

    if (document.visibility === "private") {
      if (
        document.createdBy.toString() !==
        req.user._id.toString()
      ) {
        throw new ApiError(
          403,
          "You are not allowed to access this document"
        );
      }
    }

    const summary =
      await generateSummary(document);

    document.aiSummary = summary;

    await document.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          summary,
        },
        "Document summarized successfully"
      )
    );
  }
);

const translateDocumentController =
  asyncHandler(
    async (req, res) => {
      const { documentId } = req.params;
      const { language } = req.body;

      if (!language?.trim()) {
        throw new ApiError(
          400,
          "Target language is required"
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

      if (
        document.visibility === "private"
      ) {
        if (
          document.createdBy.toString() !==
          req.user._id.toString()
        ) {
          throw new ApiError(
            403,
            "You are not allowed to access this document"
          );
        }
      }

      const translation =
        await translateDocument(
          document,
          language.trim()
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            language: language.trim(),
            translation,
          },
          "Document translated successfully"
        )
      );
    }
  );

export {
  summarizeDocument,
  translateDocumentController,
};
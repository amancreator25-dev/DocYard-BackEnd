import { Document } from "../models/document.model.js";
import { generateSummary, translateDocument } from "../services/ai.service.js";

// ======================================
// SUMMARIZE DOCUMENT
// ======================================
const summarizeDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check private document access
    if (document.visibility === "private") {
      if (
        document.createdBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to access this document",
        });
      }
    }

    // Generate summary
    const summary = await generateSummary(document);

    // Store summary
    document.aiSummary = summary;

    await document.save();

    return res.status(200).json({
      success: true,
      message: "Document summarized successfully",
      summary,
    });
  } catch (error) {
    console.error("Summarize Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while summarizing document",
      error: error.message,
    });
  }
};


// ======================================
// TRANSLATE DOCUMENT
// ======================================
const translateDocumentController = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Target language is required",
      });
    }

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check private document access
    if (document.visibility === "private") {
      if (
        document.createdBy.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to access this document",
        });
      }
    }

    // Generate translation
    const translation = await translateDocument(
      document,
      language
    );

    return res.status(200).json({
      success: true,
      message: "Document translated successfully",
      language,
      translation,
    });
  } catch (error) {
    console.error("Translate Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while translating document",
      error: error.message,
    });
  }
};


// ======================================
// EXPORT
// ======================================

export {
  summarizeDocument,
  translateDocumentController,
};
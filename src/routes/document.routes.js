import { Router } from "express";

import {
  createDocument,
  getAllDocuments,
  getDocumentBySlug,
  getMyDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from "../controllers/document.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


// ======================================
// PUBLIC ROUTES
// ======================================

// Get all public documents
router.get("/", getAllDocuments);

// Get document by SEO slug
router.get("/slug/:slug", getDocumentBySlug);


// ======================================
// PROTECTED ROUTES
// ======================================

// Get logged-in user's documents
router.get(
  "/my",
  authMiddleware,
  getMyDocuments
);

// Create document
router.post(
  "/",
  authMiddleware,
  upload.single("document"),
  createDocument
);

// Update document
router.patch(
  "/:documentId",
  authMiddleware,
  upload.single("document"),
  updateDocument
);

// Delete document
router.delete(
  "/:documentId",
  authMiddleware,
  deleteDocument
);

// Download document
router.get(
  "/download/:documentId",
  downloadDocument
);

export default router;
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

router.get("/", getAllDocuments);

router.get("/slug/:slug", getDocumentBySlug);

router.get(
  "/my",
  authMiddleware,
  getMyDocuments
);

router.post(
  "/",
  authMiddleware,
  upload.single("document"),
  createDocument
);

router.patch(
  "/:documentId",
  authMiddleware,
  upload.single("document"),
  updateDocument
);

router.delete(
  "/:documentId",
  authMiddleware,
  deleteDocument
);

router.get(
  "/download/:documentId",
  downloadDocument
);

export default router;
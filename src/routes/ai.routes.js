import { Router } from "express";

import {
  summarizeDocument,
  translateDocumentController,
} from "../controllers/ai.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();


// ======================================
// SUMMARIZE DOCUMENT
// ======================================

router.post(
  "/summarize/:documentId",
  authMiddleware,
  summarizeDocument
);


// ======================================
// TRANSLATE DOCUMENT
// ======================================

router.post(
  "/translate/:documentId",
  authMiddleware,
  translateDocumentController
);


export default router;
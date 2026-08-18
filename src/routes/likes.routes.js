import { Router } from "express";

import {
  likeDocument,
  unlikeDocument,
  checkLikeStatus,
  getLikeCount,
} from "../controllers/like.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();


// ======================================
// LIKE DOCUMENT
// ======================================

router.post(
  "/:documentId",
  authMiddleware,
  likeDocument
);


// ======================================
// UNLIKE DOCUMENT
// ======================================

router.delete(
  "/:documentId",
  authMiddleware,
  unlikeDocument
);


// ======================================
// CHECK LIKE STATUS
// ======================================

router.get(
  "/:documentId/status",
  authMiddleware,
  checkLikeStatus
);


// ======================================
// GET LIKE COUNT
// ======================================

router.get(
  "/:documentId/count",
  getLikeCount
);


export default router;
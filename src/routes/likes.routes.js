import { Router } from "express";

import {
  likeDocument,
  unlikeDocument,
  checkLikeStatus,
  getLikeCount,
} from "../controllers/like.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/:documentId",
  authMiddleware,
  likeDocument
);

router.delete(
  "/:documentId",
  authMiddleware,
  unlikeDocument
);

router.get(
  "/:documentId/status",
  authMiddleware,
  checkLikeStatus
);

router.get(
  "/:documentId/count",
  getLikeCount
);

export default router;
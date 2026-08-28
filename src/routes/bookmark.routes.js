import { Router } from "express";

import {
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getMyBookmarks,
} from "../controllers/bookmark.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/:documentId",
  authMiddleware,
  addBookmark
);

router.delete(
  "/:documentId",
  authMiddleware,
  removeBookmark
);

router.get(
  "/:documentId/status",
  authMiddleware,
  checkBookmarkStatus
);

router.get(
  "/my",
  authMiddleware,
  getMyBookmarks
);

export default router;
import { Router } from "express";

import {
  addBookmark,
  removeBookmark,
  checkBookmarkStatus,
  getMyBookmarks,
} from "../controllers/bookmark.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();


// ======================================
// ADD BOOKMARK
// ======================================

router.post(
  "/:documentId",
  authMiddleware,
  addBookmark
);


// ======================================
// REMOVE BOOKMARK
// ======================================

router.delete(
  "/:documentId",
  authMiddleware,
  removeBookmark
);


// ======================================
// CHECK BOOKMARK STATUS
// ======================================

router.get(
  "/:documentId/status",
  authMiddleware,
  checkBookmarkStatus
);


// ======================================
// GET MY BOOKMARKS
// ======================================

router.get(
  "/my",
  authMiddleware,
  getMyBookmarks
);


export default router;
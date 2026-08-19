import { Router } from "express";

import {
  addComment,
  getDocumentComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();


// ======================================
// GET DOCUMENT COMMENTS
// ======================================

router.get(
  "/document/:documentId",
  getDocumentComments
);


// ======================================
// ADD COMMENT / REPLY
// ======================================

router.post(
  "/document/:documentId",
  authMiddleware,
  addComment
);


// ======================================
// UPDATE COMMENT
// ======================================

router.patch(
  "/:commentId",
  authMiddleware,
  updateComment
);


// ======================================
// DELETE COMMENT
// ======================================

router.delete(
  "/:commentId",
  authMiddleware,
  deleteComment
);


export default router;
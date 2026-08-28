import { Router } from "express";

import {
  addComment,
  getDocumentComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get(
  "/document/:documentId",
  getDocumentComments
);

router.post(
  "/document/:documentId",
  authMiddleware,
  addComment
);

router.patch(
  "/:commentId",
  authMiddleware,
  updateComment
);

router.delete(
  "/:commentId",
  authMiddleware,
  deleteComment
);

export default router;
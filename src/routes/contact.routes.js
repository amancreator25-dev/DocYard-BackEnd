import { Router } from "express";

import {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
} from "../controllers/contact.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

router.post(
  "/",
  createContact
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllContacts
);

router.get(
  "/:contactId",
  authMiddleware,
  adminMiddleware,
  getContactById
);

router.patch(
  "/:contactId/status",
  authMiddleware,
  adminMiddleware,
  updateContactStatus
);

router.delete(
  "/:contactId",
  authMiddleware,
  adminMiddleware,
  deleteContact
);

export default router;
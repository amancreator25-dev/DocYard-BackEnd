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


// ======================================
// PUBLIC ROUTE
// ======================================

// Anyone can contact DocYard
router.post(
  "/",
  createContact
);


// ======================================
// ADMIN ROUTES
// ======================================

// Get all contact messages
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAllContacts
);


// Get single contact message
router.get(
  "/:contactId",
  authMiddleware,
  adminMiddleware,
  getContactById
);


// Update contact status
router.patch(
  "/:contactId/status",
  authMiddleware,
  adminMiddleware,
  updateContactStatus
);


// Delete contact message
router.delete(
  "/:contactId",
  authMiddleware,
  adminMiddleware,
  deleteContact
);


export default router;
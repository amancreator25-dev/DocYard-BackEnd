import { Router } from "express";

import {
  getAdminDashboard,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllDocumentsAdmin,
  adminDeleteDocument,
  getContactStatistics,
} from "../controllers/admin.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();


// ======================================
// ADMIN MIDDLEWARE
// ======================================

router.use(
  authMiddleware,
  adminMiddleware
);


// ======================================
// DASHBOARD
// ======================================

// Get dashboard statistics
router.get(
  "/dashboard",
  getAdminDashboard
);


// ======================================
// USER MANAGEMENT
// ======================================

// Get all users
router.get(
  "/users",
  getAllUsers
);

// Get user by ID
router.get(
  "/users/:userId",
  getUserById
);

// Update user role
router.patch(
  "/users/:userId/role",
  updateUserRole
);

// Delete user
router.delete(
  "/users/:userId",
  deleteUser
);


// ======================================
// DOCUMENT MANAGEMENT
// ======================================

// Get all documents
router.get(
  "/documents",
  getAllDocumentsAdmin
);

// Delete document
router.delete(
  "/documents/:documentId",
  adminDeleteDocument
);


// ======================================
// CONTACT MANAGEMENT
// ======================================

// Get contact statistics
router.get(
  "/contacts/statistics",
  getContactStatistics
);


export default router;
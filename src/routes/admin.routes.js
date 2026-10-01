import { Router } from "express";

import {
  sendAdminLoginOTP,
  verifyAdminOTP,
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
// ADMIN LOGIN OTP
// ======================================

// These routes must be accessible before
// admin authentication is established.

router.post(
  "/login",
  sendAdminLoginOTP
);

router.post(
  "/verify-admin-otp",
  verifyAdminOTP
);


router.use(
  authMiddleware,
  adminMiddleware
);



router.get(
  "/dashboard",
  getAdminDashboard
);


router.get(
  "/users",
  getAllUsers
);

router.get(
  "/users/:userId",
  getUserById
);

router.patch(
  "/users/:userId/role",
  updateUserRole
);

router.delete(
  "/users/:userId",
  deleteUser
);


router.get(
  "/documents",
  getAllDocumentsAdmin
);

router.delete(
  "/documents/:documentId",
  adminDeleteDocument
);



router.get(
  "/contacts/statistics",
  getContactStatistics
);

export default router;
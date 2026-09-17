import { Router } from "express";

import {
  registerUser,
  verifyRegistrationOTP,

  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,

  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changePassword,
  updateProfile,
  getUserProfile,
} from "../controllers/user.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// ======================================
// REGISTRATION
// ======================================

router.post(
  "/register",
  registerUser
);

router.post(
  "/verify-registration-otp",
  verifyRegistrationOTP
);

// ======================================
// FORGOT PASSWORD
// ======================================

router.post(
  "/forgot-password",
  sendForgotPasswordOTP
);

router.post(
  "/verify-forgot-password-otp",
  verifyForgotPasswordOTP
);

router.post(
  "/reset-password",
  resetPassword
);

// ======================================
// LOGIN
// ======================================

router.post(
  "/login",
  loginUser
);

router.post(
  "/refresh-token",
  refreshAccessToken
);

// ======================================
// PUBLIC PROFILE
// ======================================

router.get(
  "/profile/:username",
  getUserProfile
);

// ======================================
// AUTHENTICATED ROUTES
// ======================================

router.post(
  "/logout",
  authMiddleware,
  logoutUser
);

router.get(
  "/me",
  authMiddleware,
  getCurrentUser
);

router.patch(
  "/change-password",
  authMiddleware,
  changePassword
);

router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);

export default router;
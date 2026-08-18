import { Router } from "express";

import {
  registerUser,
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
// PUBLIC ROUTES
// ======================================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Refresh access token
router.post("/refresh-token", refreshAccessToken);

// Get public user profile
router.get("/profile/:username", getUserProfile);


// ======================================
// PROTECTED ROUTES
// ======================================

// Logout
router.post(
  "/logout",
  authMiddleware,
  logoutUser
);

// Current logged-in user
router.get(
  "/me",
  authMiddleware,
  getCurrentUser
);

// Change password
router.patch(
  "/change-password",
  authMiddleware,
  changePassword
);

// Update profile
router.patch(
  "/profile",
  authMiddleware,
  updateProfile
);


export default router;
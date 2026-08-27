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

router.post(
  "/register",
  registerUser
);

router.post(
  "/login",
  loginUser
);

router.post(
  "/refresh-token",
  refreshAccessToken
);

router.get(
  "/profile/:username",
  getUserProfile
);

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
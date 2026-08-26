import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const authMiddleware = asyncHandler(
  async (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req
        .header("Authorization")
        ?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(
        401,
        "Access token is required"
      );
    }

    let decodedToken;

    try {
      decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );
    } catch (error) {
      if (
        error.name === "TokenExpiredError"
      ) {
        throw new ApiError(
          401,
          "Access token has expired"
        );
      }

      if (
        error.name === "JsonWebTokenError"
      ) {
        throw new ApiError(
          401,
          "Invalid access token"
        );
      }

      throw new ApiError(
        401,
        "Authentication failed"
      );
    }

    const user =
      await User.findById(
        decodedToken._id
      ).select(
        "-password -refreshToken"
      );

    if (!user) {
      throw new ApiError(
        401,
        "User not found"
      );
    }

    req.user = user;

    next();
  }
);

export {
  authMiddleware,
};
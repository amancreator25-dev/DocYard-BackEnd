import  asyncHandler  from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const adminMiddleware = asyncHandler(
  async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required"
      );
    }

    if (req.user.role !== "admin") {
      throw new ApiError(
        403,
        "Access denied. Admin privileges required"
      );
    }

    next();
  }
);

export {
  adminMiddleware,
};
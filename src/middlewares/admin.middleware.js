const adminMiddleware = (req, res, next) => {
  try {
    // authMiddleware should run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check user role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while checking permissions",
    });
  }
};

export { adminMiddleware };
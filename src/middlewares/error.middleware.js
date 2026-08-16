const errorMiddleware = (err, req, res, next) => {
  console.error("ERROR:", err);

  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // --------------------------------------
  // Multer Errors
  // --------------------------------------

  if (err.name === "MulterError") {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size cannot exceed 10 MB";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Only one file can be uploaded at a time";
    } else {
      message = err.message;
    }
  }

  // --------------------------------------
  // Invalid MongoDB ObjectId
  // --------------------------------------

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // --------------------------------------
  // MongoDB Duplicate Key
  // --------------------------------------

  if (err.code === 11000) {
    statusCode = 409;

    const duplicateField = Object.keys(err.keyValue || {})[0];

    message = duplicateField
      ? `${duplicateField} already exists`
      : "Duplicate value already exists";
  }

  // --------------------------------------
  // Mongoose Validation Error
  // --------------------------------------

  if (err.name === "ValidationError") {
    statusCode = 400;

    const messages = Object.values(err.errors).map(
      (error) => error.message
    );

    message = messages.join(", ");
  }

  // --------------------------------------
  // Response
  // --------------------------------------

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      error: err.stack,
    }),
  });
};

export { errorMiddleware };
import multer from "multer";
import path from "path";
import fs from "fs";

// ======================================
// UPLOAD DIRECTORY
// ======================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "documents"
);

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}


// ======================================
// STORAGE
// ======================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);

    const fileName =
      `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

    cb(null, fileName);
  },
});


// ======================================
// FILE FILTER
// ======================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  const allowedExtensions = [
    ".pdf",
    ".docx",
    ".txt",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  // Check MIME type and extension
  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, DOCX and TXT files are allowed"
      ),
      false
    );
  }
};


// ======================================
// MULTER CONFIGURATION
// ======================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});


// ======================================
// EXPORT
// ======================================

export { upload };
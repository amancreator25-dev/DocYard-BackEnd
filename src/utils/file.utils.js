import fs from "fs";
import path from "path";

const getFileExtension = (filename) => {
  return path
    .extname(filename)
    .toLowerCase()
    .replace(".", "");
};

const deleteLocalFile = (filePath) => {
  if (!filePath) return;

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const getMimeType = (fileType) => {
  switch (fileType?.toLowerCase()) {
    case "pdf":
      return "application/pdf";

    case "doc":
      return "application/msword";

    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    case "txt":
      return "text/plain";

    case "png":
      return "image/png";

    case "jpg":
    case "jpeg":
      return "image/jpeg";

    default:
      return "application/octet-stream";
  }
};

const getFileName = (filePath) => {
  return path.basename(filePath);
};

const getFileSizeInMB = (size) => {
  return Number(
    (size / (1024 * 1024)).toFixed(2)
  );
};

export {
  getFileExtension,
  deleteLocalFile,
  getMimeType,
  getFileName,
  getFileSizeInMB,
};
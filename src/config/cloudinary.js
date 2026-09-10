import "dotenv/config";

import { v2 as cloudinary } from "cloudinary";


// ======================================
// CLOUDINARY CONFIGURATION
// ======================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// ======================================
// CHECK CONFIGURATION
// ======================================

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error(
    "❌ Cloudinary environment variables are missing."
  );

  console.error(
    "CLOUDINARY_CLOUD_NAME:",
    process.env.CLOUDINARY_CLOUD_NAME
      ? "Loaded"
      : "Missing"
  );

  console.error(
    "CLOUDINARY_API_KEY:",
    process.env.CLOUDINARY_API_KEY
      ? "Loaded"
      : "Missing"
  );

  console.error(
    "CLOUDINARY_API_SECRET:",
    process.env.CLOUDINARY_API_SECRET
      ? "Loaded"
      : "Missing"
  );
} else {
  console.log(
    "✅ Cloudinary configuration loaded successfully."
  );
}


// ======================================
// UPLOAD TO CLOUDINARY
// ======================================

const uploadToCloudinary = async (
  filePath,
  folder = "docyard/documents"
) => {
  try {
    const result =
      await cloudinary.uploader.upload(
        filePath,
        {
          folder,
          resource_type: "raw",
        }
      );

    return result;

  } catch (error) {
    console.error(
      "❌ Cloudinary Upload Error:",
      error
    );

    throw new Error(
      "Failed to upload file to Cloudinary"
    );
  }
};


// ======================================
// DELETE FROM CLOUDINARY
// ======================================

const deleteFromCloudinary = async (
  publicId,
  resourceType = "raw"
) => {
  try {
    const result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type: resourceType,
        }
      );

    return result;

  } catch (error) {
    console.error(
      "❌ Cloudinary Delete Error:",
      error
    );

    throw new Error(
      "Failed to delete file from Cloudinary"
    );
  }
};


// ======================================
// EXPORTS
// ======================================

export {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
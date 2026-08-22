import { v2 as cloudinary } from "cloudinary";



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const uploadToCloudinary = async (
  filePath,
  folder = "docyard/documents"
) => {
  try {
    const result = await cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: "raw",
      }
    );

    return result;
  } catch (error) {
    console.error(
      "Cloudinary Upload Error:",
      error
    );

    throw new Error(
      "Failed to upload file to Cloudinary"
    );
  }
};



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
      "Cloudinary Delete Error:",
      error
    );

    throw new Error(
      "Failed to delete file from Cloudinary"
    );
  }
};



export {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
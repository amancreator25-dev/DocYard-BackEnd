import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      maxlength: 150,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 1000,
    },

    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: 100,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    fileUrl: {
      type: String,
      required: [true, "Document file is required"],
    },

    thumbnail: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      enum: ["pdf", "docx", "txt"],
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    language: {
      type: String,
      default: "English",
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    aiSummary: {
      type: String,
      default: "",
    },

    translatedLanguages: [
      {
        type: String,
      },
    ],

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
 

export const Document = mongoose.model("Document", documentSchema);
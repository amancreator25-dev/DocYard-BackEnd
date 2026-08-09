import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// A user can bookmark a document only once
bookmarkSchema.index(
  { user: 1, document: 1 },
  { unique: true }
);

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
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

likeSchema.index(
  { user: 1, document: 1 },
  { unique: true }
);

export const Like = mongoose.model("Like", likeSchema);
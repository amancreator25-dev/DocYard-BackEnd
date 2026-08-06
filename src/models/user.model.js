import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },

        fullname: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        avatar: {
            type: String,
            default: "",
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
        },

        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
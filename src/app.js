import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

// ======================================
// ROUTES
// ======================================

import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import likeRoutes from "./routes/like.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import searchRoutes from "./routes/search.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminRoutes from "./routes/admin.routes.js";

// ======================================
// MIDDLEWARE
// ======================================

import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();


// ======================================
// BASIC CONFIGURATION
// ======================================

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());


// ======================================
// STATIC FILES
// ======================================

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);


// ======================================
// HEALTH CHECK
// ======================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DocYard API is running",
  });
});


// ======================================
// API ROUTES
// ======================================

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

app.use(
  "/api/likes",
  likeRoutes
);

app.use(
  "/api/bookmarks",
  bookmarkRoutes
);

app.use(
  "/api/comments",
  commentRoutes
);

app.use(
  "/api/contacts",
  contactRoutes
);

app.use(
  "/api/search",
  searchRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);


// ======================================
// 404 HANDLER
// ======================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});


// ======================================
// GLOBAL ERROR HANDLER
// ======================================

app.use(errorMiddleware);


export default app;
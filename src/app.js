import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import userRoutes from "./routes/user.routes.js";
import documentRoutes from "./routes/document.routes.js";
import likeRoutes from "./routes/likes.routes.js";
import bookmarkRoutes from "./routes/bookmark.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import searchRoutes from "./routes/search.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

app.use(
  "/uploads",
  express.static(
    path.join(
      process.cwd(),
      "uploads"
    )
  )
);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "DocYard API is running",
  });
});

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

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorMiddleware);

export default app;
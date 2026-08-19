import { Router } from "express";

import {
  searchDocuments,
} from "../controllers/search.controller.js";

const router = Router();


// ======================================
// SEARCH DOCUMENTS
// ======================================

router.get(
  "/",
  searchDocuments
);


export default router;
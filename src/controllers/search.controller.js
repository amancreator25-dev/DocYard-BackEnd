import { Document } from "../models/document.model.js";

// ======================================
// SEARCH & FILTER DOCUMENTS
// ======================================
const searchDocuments = async (req, res) => {
  try {
    const {
      q,
      category,
      language,
      tag,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    // -------------------------------
    // Pagination
    // -------------------------------

    const currentPage = Math.max(parseInt(page) || 1, 1);

    const itemsPerPage = Math.min(
      Math.max(parseInt(limit) || 12, 1),
      50
    );

    const skip = (currentPage - 1) * itemsPerPage;

    // -------------------------------
    // Build Query
    // -------------------------------

    const query = {
      visibility: "public",
    };

    // Text search
    if (q && q.trim()) {
      query.$text = {
        $search: q.trim(),
      };
    }

    // Category filter
    if (category && category.trim()) {
      query.category = category.trim();
    }

    // Language filter
    if (language && language.trim()) {
      query.language = language.trim();
    }

    // Tag filter
    if (tag && tag.trim()) {
      query.tags = tag.trim().toLowerCase();
    }

    // -------------------------------
    // Sorting
    // -------------------------------

    let sortOption = {};

    switch (sort) {
      case "oldest":
        sortOption = {
          createdAt: 1,
        };
        break;

      case "mostViewed":
        sortOption = {
          views: -1,
        };
        break;

      case "mostDownloaded":
        sortOption = {
          downloads: -1,
        };
        break;

      case "newest":
      default:
        sortOption = {
          createdAt: -1,
        };
        break;
    }

    // -------------------------------
    // Get Documents
    // -------------------------------

    const [documents, totalDocuments] =
      await Promise.all([
        Document.find(query)
          .populate(
            "createdBy",
            "username fullname avatar"
          )
          .sort(sortOption)
          .skip(skip)
          .limit(itemsPerPage),

        Document.countDocuments(query),
      ]);

    // -------------------------------
    // Pagination Information
    // -------------------------------

    const totalPages = Math.ceil(
      totalDocuments / itemsPerPage
    );

    return res.status(200).json({
      success: true,

      documents,

      pagination: {
        currentPage,
        itemsPerPage,
        totalDocuments,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1,
      },
    });
  } catch (error) {
    console.error(
      "Search Documents Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while searching documents",
      error: error.message,
    });
  }
};

export {
  searchDocuments,
};
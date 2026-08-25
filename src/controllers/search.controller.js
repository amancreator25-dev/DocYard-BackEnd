import { Document } from "../models/document.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const searchDocuments = asyncHandler(
  async (req, res) => {
    const {
      q,
      category,
      language,
      tag,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const currentPage = Math.max(
      parseInt(page) || 1,
      1
    );

    const itemsPerPage = Math.min(
      Math.max(
        parseInt(limit) || 12,
        1
      ),
      50
    );

    const skip =
      (currentPage - 1) *
      itemsPerPage;

    const query = {
      visibility: "public",
    };

    if (q && q.trim()) {
      query.$text = {
        $search: q.trim(),
      };
    }

    if (category && category.trim()) {
      query.category = category.trim();
    }

    if (language && language.trim()) {
      query.language = language.trim();
    }

    if (tag && tag.trim()) {
      query.tags = tag.trim().toLowerCase();
    }

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

    const [
      documents,
      totalDocuments,
    ] = await Promise.all([
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

    const totalPages = Math.ceil(
      totalDocuments / itemsPerPage
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
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
        },
        "Documents fetched successfully"
      )
    );
  }
);

export {
  searchDocuments,
};
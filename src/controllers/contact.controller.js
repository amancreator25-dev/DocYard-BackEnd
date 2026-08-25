import { Contact } from "../models/contact.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createContact = asyncHandler(
  async (req, res) => {
    const {
      name,
      email,
      subject,
      message,
    } = req.body;

    if (
      !name ||
      !email ||
      !subject ||
      !message
    ) {
      throw new ApiError(
        400,
        "All fields are required"
      );
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      user: req.user?._id || null,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        { contact },
        "Your message has been sent successfully"
      )
    );
  }
);

const getAllContacts = asyncHandler(
  async (req, res) => {
    const contacts = await Contact.find()
      .populate(
        "user",
        "username fullname email"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: contacts.length,
          contacts,
        },
        "Contact messages fetched successfully"
      )
    );
  }
);

const getContactById = asyncHandler(
  async (req, res) => {
    const { contactId } = req.params;

    const contact =
      await Contact.findById(
        contactId
      ).populate(
        "user",
        "username fullname email"
      );

    if (!contact) {
      throw new ApiError(
        404,
        "Contact message not found"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { contact },
        "Contact message fetched successfully"
      )
    );
  }
);

const updateContactStatus = asyncHandler(
  async (req, res) => {
    const { contactId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "in-progress",
      "resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        400,
        "Invalid contact status"
      );
    }

    const contact =
      await Contact.findById(
        contactId
      );

    if (!contact) {
      throw new ApiError(
        404,
        "Contact message not found"
      );
    }

    contact.status = status;

    await contact.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { contact },
        "Contact status updated successfully"
      )
    );
  }
);

const deleteContact = asyncHandler(
  async (req, res) => {
    const { contactId } = req.params;

    const contact =
      await Contact.findById(
        contactId
      );

    if (!contact) {
      throw new ApiError(
        404,
        "Contact message not found"
      );
    }

    await Contact.findByIdAndDelete(
      contactId
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Contact message deleted successfully"
      )
    );
  }
);

export {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};
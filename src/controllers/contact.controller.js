import { Contact } from "../models/contact.model.js";

// ======================================
// CREATE CONTACT MESSAGE
// ======================================
const createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      subject,
      message,
    } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Create contact message
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),

      // Optional for guest users
      user: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully",
      contact,
    });
  } catch (error) {
    console.error("Create Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending your message",
      error: error.message,
    });
  }
};


// ======================================
// GET ALL CONTACT MESSAGES
// ======================================
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find()
      .populate("user", "username fullname email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error("Get Contacts Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching contact messages",
      error: error.message,
    });
  }
};


// ======================================
// GET SINGLE CONTACT MESSAGE
// ======================================
const getContactById = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId)
      .populate("user", "username fullname email");

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    return res.status(200).json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("Get Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching contact message",
      error: error.message,
    });
  }
};


// ======================================
// UPDATE CONTACT STATUS
// ======================================
const updateContactStatus = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status } = req.body;

    // Validate status
    const allowedStatuses = [
      "pending",
      "in-progress",
      "resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact status",
      });
    }

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    contact.status = status;

    await contact.save();

    return res.status(200).json({
      success: true,
      message: "Contact status updated successfully",
      contact,
    });
  } catch (error) {
    console.error("Update Contact Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating contact status",
      error: error.message,
    });
  }
};


// ======================================
// DELETE CONTACT MESSAGE
// ======================================
const deleteContact = async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact message not found",
      });
    }

    await Contact.findByIdAndDelete(contactId);

    return res.status(200).json({
      success: true,
      message: "Contact message deleted successfully",
    });
  } catch (error) {
    console.error("Delete Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting contact message",
      error: error.message,
    });
  }
};


export {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};
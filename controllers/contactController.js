const express = require("express");
const Contact = require("../models/contactModel");

const router = express.Router();

/** ➤ CREATE Contact (POST) */
router.post("/", async (req, res) => {
  try {
    const { name, mobileNumber, message, program } = req.body;

    // Validation
    if (!name || !mobileNumber || !message) {
      return res.status(400).json({ error: "Name, Mobile Number, and Message are required" });
    }

    const newContact = await Contact.create({
      name,
      mobileNumber,
      message,
      program,
    });

    res.status(201).json(newContact);
  } catch (error) {
    console.error("Error saving contact form:", error);
    res.status(500).json({ error: error.message || "Error saving contact form" });
  }
});

/** ➤ GET All Contact Entries */
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: error.message || "Error fetching contact entries" });
  }
});

/** ➤ GET Contact by ID */
router.get("/:id", async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: error.message || "Error fetching contact entry" });
  }
});

/** ➤ DELETE Contact */
router.delete("/:id", async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);
    if (!deletedContact)
      return res.status(404).json({ error: "Contact entry not found" });

    res.json({ message: "Contact entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: error.message || "Error deleting contact entry" });
  }
});

module.exports = router;

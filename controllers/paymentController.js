const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Payment = require("../models/paymentModel");

const router = express.Router();

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max size
});

// CREATE payment
router.post("/", upload.single("qrCodeImage"), async (req, res) => {
  try {
    const {
      name, email, carModel, garage, garageId,
      service, price, transactionId
    } = req.body;

    const qrCodeImage = req.file ? req.file.filename : null;

    if (
      !name || !email || !carModel || !garage || !garageId ||
      !service || !price || !transactionId || !qrCodeImage
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newPayment = await Payment.create({
      name,
      email,
      carModel,
      garage,
      garageId,
      service,
      price: Number(price),
      transactionId,
      qrCodeImage,
      status: "Pending",
    });

    res.status(201).json(newPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: error.message || "Error saving payment" });
  }
});

// GET all payments
router.get("/", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: error.message || "Error fetching payments" });
  }
});

// GET payments by email
router.get("/email/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const payments = await Payment.find({ email }).sort({ createdAt: -1 });
    if (!payments.length) {
      return res.status(404).json({ message: "No payments found for this email" });
    }
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments by email:", error);
    res.status(500).json({ error: error.message || "Error fetching payments" });
  }
});

// GET payment by ID
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: error.message || "Error fetching payment" });
  }
});

// UPDATE payment
router.put("/:id", upload.single("qrCodeImage"), async (req, res) => {
  try {
    const {
      name, email, carModel, garage, garageId,
      service, price, transactionId, status
    } = req.body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (carModel) updatedData.carModel = carModel;
    if (garage) updatedData.garage = garage;
    if (garageId) updatedData.garageId = garageId;
    if (service) updatedData.service = service;
    if (price) updatedData.price = Number(price);
    if (transactionId) updatedData.transactionId = transactionId;
    if (status) updatedData.status = status;
    if (req.file) updatedData.qrCodeImage = req.file.filename;

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedPayment)
      return res.status(404).json({ error: "Payment not found" });

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: error.message || "Error updating payment" });
  }
});

// DELETE payment
router.delete("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    // Delete file from disk
    const filePath = path.join(__dirname, "../uploads", payment.qrCodeImage);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: error.message || "Error deleting payment" });
  }
});

module.exports = router;
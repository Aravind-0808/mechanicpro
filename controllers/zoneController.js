const express = require("express");
const Zone = require("../models/zoneModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Configure Multer for file uploads
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
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/** ➤ CREATE Zone (POST) */
router.post("/", upload.single("zoneImage"), async (req, res) => {
  try {
    const { zoneName,uploadedBy } = req.body;

    // Validation
    if (!zoneName || !req.file) {
      return res.status(400).json({ 
        error: "Zone name and image are required" 
      });
    }

    const zoneImagePath = path.join("uploads", req.file.filename);

    const newZone = await Zone.create({
      zoneName,
      zoneImage: zoneImagePath,
      uploadedBy
    });

    res.status(201).json(newZone);
  } catch (error) {
    console.error("Error creating zone:", error);
    res.status(500).json({ 
      error: error.message || "Error creating zone" 
    });
  }
});

/** ➤ GET All Zones */
router.get("/", async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });
    res.json(zones);
  } catch (error) {
    console.error("Error fetching zones:", error);
    res.status(500).json({ 
      error: error.message || "Error fetching zones" 
    });
  }
});

/** ➤ GET Zone by ID */
router.get("/:id", async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }
    res.json(zone);
  } catch (error) {
    console.error("Error fetching zone:", error);
    res.status(500).json({ 
      error: error.message || "Error fetching zone" 
    });
  }
});

/** ➤ UPDATE Zone */
router.put("/:id", upload.single("zoneImage"), async (req, res) => {
  try {
    const { zoneName } = req.body;
    const zoneId = req.params.id;

    const existingZone = await Zone.findById(zoneId);
    if (!existingZone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    let zoneImagePath = existingZone.zoneImage;
    
    // If new image uploaded, update the path and delete old image
    if (req.file) {
      // Delete old image
      if (existingZone.zoneImage) {
        const oldImagePath = path.join(__dirname, "../", existingZone.zoneImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      zoneImagePath = path.join("uploads", req.file.filename);
    }

    const updatedZone = await Zone.findByIdAndUpdate(
      zoneId,
      {
        zoneName,
        zoneImage: zoneImagePath
      },
      { new: true }
    );

    res.json(updatedZone);
  } catch (error) {
    console.error("Error updating zone:", error);
    res.status(500).json({ 
      error: error.message || "Error updating zone" 
    });
  }
});

/** ➤ DELETE Zone */
router.delete("/:id", async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    // Delete associated image
    if (zone.zoneImage) {
      const imagePath = path.join(__dirname, "../", zone.zoneImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: "Zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting zone:", error);
    res.status(500).json({ 
      error: error.message || "Error deleting zone" 
    });
  }
});

module.exports = router;
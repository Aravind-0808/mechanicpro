const express = require("express");
const router = express.Router();
const Garage = require("../models/garageModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Storage Setup
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
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadFields = upload.fields([
  { name: "GarageMainImage", maxCount: 1 },
  { name: "GarageImage", maxCount: 10 },
  { name: "GarageServices[].ServiceImage" } // multer can't parse nested fields, handle differently
]);

// Helper: Delete files from disk
const deleteFiles = (files) => {
  files.forEach(file => {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.error("Error deleting file:", file, err.message);
    }
  });
};

// GET all garages
router.get("/", async (req, res) => {
  try {
    const garages = await Garage.find();
    res.json(garages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET garages by zone
router.get("/zone/:zone", async (req, res) => {
  try {
    const zoneParam = req.params.zone;
    const garages = await Garage.find({ zone: zoneParam });
    if (garages.length === 0) {
      return res.status(404).json({ message: "No garages found for this zone" });
    }
    res.json(garages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET garage by ID
router.get("/:id", async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }
    res.json(garage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// POST create new garage
router.post("/", upload.fields([
  { name: "GarageMainImage", maxCount: 1 },
  { name: "GarageImage", maxCount: 10 },
  { name: "ServiceImages", maxCount: 20 }
]), async (req, res) => {
  try {
    // Parse GarageServices JSON string from client
    const services = JSON.parse(req.body.GarageServices || "[]");

    // Map ServiceImage files by index
    // We will expect client to send 'ServiceImages' as array of files, one for each service that has an image
    // Map them in order, assign filenames to services.
    let serviceImagesFiles = req.files["ServiceImages"] || [];

    services.forEach((service, i) => {
      if (serviceImagesFiles[i]) {
        service.ServiceImage = "uploads/" + serviceImagesFiles[i].filename;
      } else {
        service.ServiceImage = service.ServiceImage || null;
      }
    });

    const newGarage = new Garage({
      zone: req.body.zone,
      GarageName: req.body.GarageName,
      GarageLocation: req.body.GarageLocation,
      GarageMainImage: req.files["GarageMainImage"] ? "uploads/" + req.files["GarageMainImage"][0].filename : null,
      GarageImage: (req.files["GarageImage"] || []).map(file => "uploads/" + file.filename),
      GarageServices: services,
    });

    await newGarage.save();
    res.status(201).json(newGarage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update existing garage
router.put("/:id", upload.fields([
  { name: "GarageMainImage", maxCount: 1 },
  { name: "GarageImage", maxCount: 10 },
  { name: "ServiceImages", maxCount: 20 }
]), async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    // Update fields
    garage.zone = req.body.zone || garage.zone;
    garage.GarageName = req.body.GarageName || garage.GarageName;
    garage.GarageLocation = req.body.GarageLocation || garage.GarageLocation;

    // Replace GarageMainImage if new file uploaded
    if (req.files["GarageMainImage"]) {
      // Delete old image file
      if (garage.GarageMainImage) {
        fs.unlink(path.join(__dirname, "..", garage.GarageMainImage), () => {});
      }
      garage.GarageMainImage = "uploads/" + req.files["GarageMainImage"][0].filename;
    }

    // Add new GarageImages if any (append)
    if (req.files["GarageImage"]) {
      garage.GarageImage.push(...req.files["GarageImage"].map(f => "uploads/" + f.filename));
    }

    // Parse updated GarageServices JSON from client
    const updatedServices = JSON.parse(req.body.GarageServices || "[]");

    // Map service images from upload
    let serviceImagesFiles = req.files["ServiceImages"] || [];
    updatedServices.forEach((service, i) => {
      if (serviceImagesFiles[i]) {
        // Delete old image if exists
        if (garage.GarageServices[i] && garage.GarageServices[i].ServiceImage) {
          fs.unlink(path.join(__dirname, "..", garage.GarageServices[i].ServiceImage), () => {});
        }
        service.ServiceImage = "uploads/" + serviceImagesFiles[i].filename;
      } else {
        // Keep old image if not replaced
        if (garage.GarageServices[i]) {
          service.ServiceImage = garage.GarageServices[i].ServiceImage || null;
        }
      }
    });

    garage.GarageServices = updatedServices;

    await garage.save();
    res.json(garage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE garage
router.delete("/:id", async (req, res) => {
  try {
    const garage = await Garage.findById(req.params.id);
    if (!garage) return res.status(404).json({ message: "Garage not found" });

    // Delete all images from disk
    if (garage.GarageMainImage) {
      fs.unlink(path.join(__dirname, "..", garage.GarageMainImage), () => {});
    }
    garage.GarageImage.forEach(img => {
      fs.unlink(path.join(__dirname, "..", img), () => {});
    });
    garage.GarageServices.forEach(s => {
      if (s.ServiceImage) {
        fs.unlink(path.join(__dirname, "..", s.ServiceImage), () => {});
      }
    });

    await garage.remove();
    res.json({ message: "Garage deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

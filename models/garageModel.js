const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  ServiceName: { type: String, required: true },
  ServicePrice: { type: Number, required: true },
  ServiceImage: { type: String }
});

const garageSchema = new mongoose.Schema({
  zone: { type: String, required: true },
  GarageMainImage: { type: String },
  GarageImage: [{ type: String }],
  GarageName: { type: String, required: true },
  GarageLocation: { type: String, required: true },
  GarageServices: [serviceSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Garage", garageSchema);

const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
  zoneName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  zoneImage: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Zone", zoneSchema);
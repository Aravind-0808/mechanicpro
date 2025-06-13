const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    carModel: { type: String, required: true },
    garage: { type: String, required: true },
    garageId: { type: String, required: true },
    service: { type: String, required: true },
    price: { type: Number, required: true },
    transactionId: { type: String, required: true },
    qrCodeImage: { type: String, required: true }, // store filename
    status: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

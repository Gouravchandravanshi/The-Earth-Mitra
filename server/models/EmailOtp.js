const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  codeHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  lastSentAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("EmailOtp", emailOtpSchema);

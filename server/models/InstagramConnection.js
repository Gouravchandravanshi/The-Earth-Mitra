const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  _id: { type: String, default: 'instagram' },
  appId: { type: String, required: true },
  configId: { type: String, required: true },
  encryptedToken: { type: String, required: true, select: false },
  tokenType: String,
  expiresAt: Date,
  connectedAt: { type: Date, required: true },
  connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('InstagramConnection', schema);

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  // Store hashes, never the browser's raw state or cookie value.
  _id: String,
  browserHash: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  redirectUri: { type: String, required: true },
  appId: { type: String, required: true },
  configId: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model('InstagramOAuthAttempt', schema);

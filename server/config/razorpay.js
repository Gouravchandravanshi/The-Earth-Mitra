const Razorpay = require("razorpay");

// Keep the API available when payment credentials are not configured (for
// example, local admin work). Checkout handlers return a clear 503 in that case.
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

module.exports = razorpay;

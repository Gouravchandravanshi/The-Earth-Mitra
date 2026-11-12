const connectDB = require("./config/db");
const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
// Load credentials before route/controller modules initialize payment clients.
dotenv.config({ path: path.resolve(__dirname, ".env") });
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const couponRoutes = require("./routes/couponRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminReviewRoutes = require("./routes/adminReviewRoutes");
const adminRoutes = require("./routes/adminRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const contentRoutes = require("./routes/contentRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const uploadRoutes = require("./routes/uploadRoutes");


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin(origin, callback) {
    const configuredOrigin = process.env.CLIENT_URL || "http://localhost:5173";
    const configuredOrigins = (process.env.CLIENT_URLS || "").split(",").map((value) => value.trim()).filter(Boolean);
    const allowedOrigins = new Set([configuredOrigin, ...configuredOrigins]);

    // Vite may be opened via localhost or 127.0.0.1. Allow both only during
    // development; production continues to use the explicitly configured URL.
    if (process.env.NODE_ENV !== "production") {
      allowedOrigins.add("http://localhost:5173");
      allowedOrigins.add("http://127.0.0.1:5173");
      allowedOrigins.add("http://localhost:5174");
      allowedOrigins.add("http://127.0.0.1:5174");
    }

    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true
}));

app.get("/api/health", (req, res) => {
  res.json({ message: "Earth Mitra server is running 🌱" });
});

app.use("/api/auth", authRoutes);
// Keep OAuth under /api so the existing frontend/ngrok proxy forwards callbacks.
app.use("/api/auth/instagram", require("./routes/instagramAuth"));
app.use("/api/instagram", require("./routes/instagramRoutes"));
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/blogs", contentRoutes("blog"));
app.use("/api/recipes", contentRoutes("recipe"));
app.use("/api/banners", bannerRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/shipping", require("./routes/shippingRoutes"));
app.use("/api/delivery", require("./routes/deliveryRoutes"));
app.use("/api/webhooks", require("./routes/courierWebhookRoutes"));
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", adminReviewRoutes);
app.use("/api/products/:id/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const message = String(error.message || "Unknown MongoDB connection error")
      .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, "$1[credentials-redacted]@");
    console.error(`Backend startup failed: ${message}`);
    console.error("Check MONGO_URI, Atlas Network Access/IP allowlist, and your network connection.");
    process.exitCode = 1;
  }
}

if (require.main === module) startServer();
module.exports = { app, startServer };

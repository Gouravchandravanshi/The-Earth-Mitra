require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function createOrPromoteAdmin() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password || password.length < 12) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters before running this script.");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");

  await mongoose.connect(process.env.MONGO_URI);
  let user = await User.findOne({ email });
  if (user) {
    user.name = name;
    user.password = password;
    user.role = "admin";
    await user.save();
  } else {
    user = await User.create({ name, email, password, role: "admin" });
  }
  console.log(`Admin account is ready for ${user.email}. Sign in at http://localhost:5174/login.`);
}

createOrPromoteAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

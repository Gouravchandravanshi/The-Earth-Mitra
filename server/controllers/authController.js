const { createHmac, randomBytes, randomInt, timingSafeEqual } = require("crypto");
const User = require("../models/User");
const EmailOtp = require("../models/EmailOtp");
const generateToken = require("../utils/generateToken");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const emailOtpIpRequests = new Map();
const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";
const validEmail = (email) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const hashOtp = (email, otp) => createHmac("sha256", process.env.JWT_SECRET)
  .update(`${email}:${otp}`)
  .digest("hex");

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  avatar: user.avatar,
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email: normalizedEmail, password });
    generateToken(res, user._id);
    return res.status(201).json(publicUser(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = req.body?.password;
    const user = await User.findOne({ email });
    if (!user || typeof password !== "string" || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    generateToken(res, user._id);
    return res.json(publicUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Unable to sign in" });
  }
};

// Development-only test login. The submitted OTP is checked for presence only; no OTP is sent or verified.
const phoneTestLogin = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
  if (!phone || phone.length > 32 || !otp || otp.length > 32) {
    return res.status(400).json({ message: "Enter a phone number and any test OTP." });
  }

  try {
    const identity = createHmac("sha256", process.env.JWT_SECRET || "local-test-login")
      .update(phone)
      .digest("hex");
    const email = `phone-test-${identity}@example.invalid`;
    let user = await User.findOne({ email });
    if (!user) {
      try {
        user = await User.create({
          name: "Test Customer",
          email,
          phone,
          password: randomBytes(32).toString("hex"),
          role: "user",
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        user = await User.findOne({ email });
      }
    }
    if (!user) return res.status(500).json({ message: "Unable to create test session" });
    if (user.role !== "user") return res.status(403).json({ message: "Test login is available for customer accounts only." });

    generateToken(res, user._id);
    return res.json(publicUser(user));
  } catch (error) {
    return res.status(500).json({ message: "Unable to start the test session" });
  }
};

// Request OTPs are stored only as an HMAC digest. This endpoint intentionally
// returns the same response whether or not a customer account already exists.
const requestEmailOtp = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ message: "Enter a valid email address." });
  const nowMs = Date.now();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const recentRequests = (emailOtpIpRequests.get(ip) || []).filter((time) => nowMs - time < 60 * 60 * 1000);
  if (recentRequests.length >= 10) return res.status(429).json({ message: "Too many code requests. Try again later." });
  recentRequests.push(nowMs);
  emailOtpIpRequests.set(ip, recentRequests);
  if (emailOtpIpRequests.size > 5000) emailOtpIpRequests.clear();
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !process.env.JWT_SECRET) {
    return res.status(503).json({ message: "Email sign-in is not configured. Set the server Resend sender and API key." });
  }

  try {
    const existingUser = await User.findOne({ email }).select("role");
    // Email OTP is a customer login method. Never create an admin session here.
    if (existingUser?.role === "admin") return res.json({ message: "If this address can sign in, a code has been sent." });

    const now = new Date();
    let record = await EmailOtp.findOne({ email });
    if (record && now - record.lastSentAt < OTP_RESEND_WAIT_MS) {
      return res.status(429).json({ message: "Please wait a minute before requesting another code." });
    }

    const otp = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = hashOtp(email, otp);
    if (record) {
      record.codeHash = codeHash;
      record.expiresAt = new Date(now.getTime() + OTP_TTL_MS);
      record.lastSentAt = now;
      record.attempts = 0;
      await record.save();
    } else {
      try {
        record = await EmailOtp.create({ email, codeHash, expiresAt: new Date(now.getTime() + OTP_TTL_MS), lastSentAt: now });
      } catch (error) {
        if (error.code !== 11000) throw error;
        return res.status(429).json({ message: "Please wait a minute before requesting another code." });
      }
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [email],
        subject: "Your Earth Mitra sign-in code",
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto"><h2>Sign in to Earth Mitra</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
        text: `Your Earth Mitra sign-in code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
      }),
    });
    if (!response.ok) {
      await EmailOtp.deleteOne({ email });
      console.error("Resend email delivery request failed with status", response.status);
      return res.status(502).json({ message: "Could not send a sign-in code. Check the Resend sender configuration and try again." });
    }
    return res.json({ message: "If this address can sign in, a code has been sent." });
  } catch (error) {
    console.error("Email OTP request failed:", error.message);
    return res.status(500).json({ message: "Unable to send a sign-in code right now." });
  }
};

const verifyEmailOtp = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
  if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: "Enter a valid email address and six-digit code." });
  }

  try {
    const record = await EmailOtp.findOne({ email }).select("+codeHash");
    if (!record || record.expiresAt <= new Date() || record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(401).json({ message: "That code is invalid or expired. Request a new code." });
    }

    const submittedHash = Buffer.from(hashOtp(email, otp), "hex");
    const storedHash = Buffer.from(record.codeHash, "hex");
    if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
      record.attempts += 1;
      await record.save();
      return res.status(401).json({ message: "That code is invalid or expired. Request a new code." });
    }

    let user = await User.findOne({ email });
    if (user?.role === "admin") {
      await EmailOtp.deleteOne({ email });
      return res.status(403).json({ message: "Use the admin sign-in page to access this account." });
    }
    if (!user) {
      try {
        user = await User.create({
          name: email.split("@")[0].slice(0, 64) || "Customer",
          email,
          password: randomBytes(32).toString("hex"),
          role: "user",
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        user = await User.findOne({ email });
      }
    }
    if (!user || user.role !== "user") return res.status(401).json({ message: "Unable to sign in with this email." });

    await EmailOtp.deleteOne({ email });
    generateToken(res, user._id);
    return res.json(publicUser(user));
  } catch (error) {
    console.error("Email OTP verification failed:", error.message);
    return res.status(500).json({ message: "Unable to verify the code right now." });
  }
};

const logout = async (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.json({ message: "Logged out successfully" });
};

module.exports = { register, login, phoneTestLogin, requestEmailOtp, verifyEmailOtp, logout };

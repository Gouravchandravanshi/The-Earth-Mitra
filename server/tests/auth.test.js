const test = require("node:test");
const assert = require("node:assert/strict");
const { phoneTestLogin } = require("../controllers/authController");

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.payload = body; return this; },
});

test("development phone test login requires a non-empty phone and OTP", async () => {
  const originalMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const res = createResponse();
    await phoneTestLogin({ body: { phone: "", otp: "4" } }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /phone number and any test OTP/i);
  } finally {
    if (originalMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalMode;
  }
});

test("phone test login is disabled in production", async () => {
  const originalMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const res = createResponse();
    await phoneTestLogin({ body: { phone: "+919876543210", otp: "anything" } }, res);
    assert.equal(res.statusCode, 404);
  } finally {
    if (originalMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalMode;
  }
});

const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { sendVerificationEmail } = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_prod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// 🔐 ADMIN EMAIL (Option 2)
const ADMIN_EMAIL = "admin@karima.kz";

function makeCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function expiryMinutes(min = 10) {
  return new Date(Date.now() + min * 60 * 1000);
}

// ================= REGISTER =================
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing && existing.isVerified) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const code = makeCode();
    const expires = expiryMinutes(10);

    // ✅ OPTION 2: role based on email
    const role = email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user";

    let u;
    if (existing && !existing.isVerified) {
      existing.name = name;
      existing.password = password;
      existing.role = role;
      existing.verificationCode = code;
      existing.verificationExpires = expires;
      await existing.save();
      u = existing;
    } else {
      u = new User({
        name,
        email,
        password,
        role,
        isVerified: false,
        verificationCode: code,
        verificationExpires: expires
      });
      await u.save();
    }

    try {
      await sendVerificationEmail(u.email, u.name, code);
    } catch (mailErr) {
      console.error("Email send failed:", mailErr?.message || mailErr);
      return res.status(500).json({
        error:
          "Account created, but verification email failed to send. Please use Resend Code."
      });
    }

    return res.status(201).json({
      message: "Account created. Please check your email for the verification code.",
      needsVerification: true,
      email: u.email
    });
  } catch (err) {
    next(err);
  }
}

// ================= VERIFY EMAIL =================
async function verifyEmail(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, code } = req.body;

    const u = await User.findOne({ email });
    if (!u) return res.status(404).json({ error: "User not found" });

    if (u.isVerified) {
      return res.json({ message: "Already verified. You can login now." });
    }

    if (!u.verificationCode || !u.verificationExpires) {
      return res
        .status(400)
        .json({ error: "No verification code found. Please resend." });
    }

    if (u.verificationExpires.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ error: "Verification code expired. Please resend." });
    }

    if (String(u.verificationCode).trim() !== String(code).trim()) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    u.isVerified = true;
    u.verificationCode = undefined;
    u.verificationExpires = undefined;
    await u.save();

    return res.json({
      message: "Email verified successfully. You can login now."
    });
  } catch (err) {
    next(err);
  }
}

// ================= RESEND CODE =================
async function resendCode(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    const u = await User.findOne({ email });
    if (!u) return res.status(404).json({ error: "User not found" });

    if (u.isVerified) {
      return res
        .status(400)
        .json({ error: "Email already verified. Please login." });
    }

    const code = makeCode();
    u.verificationCode = code;
    u.verificationExpires = expiryMinutes(10);
    await u.save();

    try {
      await sendVerificationEmail(u.email, u.name, code);
    } catch (mailErr) {
      console.error("Email resend failed:", mailErr?.message || mailErr);
      return res
        .status(500)
        .json({ error: "Failed to send email. Check EMAIL_USER/EMAIL_PASS." });
    }

    return res.json({
      message: "Verification code resent. Please check your email."
    });
  } catch (err) {
    next(err);
  }
}

// ================= LOGIN =================
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    const u = await User.findOne({ email }).select("+password");
    if (!u) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await u.comparePassword(password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    if (!u.isVerified) {
      return res
        .status(403)
        .json({ error: "Email not verified. Please verify first." });
    }

    const token = jwt.sign(
      { id: u._id, role: u.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      token,
      user: { id: u._id, name: u.name, email: u.email, role: u.role }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, verifyEmail, resendCode };

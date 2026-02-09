const express = require("express");
const { body } = require("express-validator");
const authCtrl = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  body("name").isString().trim().isLength({ min: 2 }).withMessage("Name required"),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6 }),
  authCtrl.register
);

router.post(
  "/login",
  body("email").isEmail().normalizeEmail(),
  body("password").isString().notEmpty(),
  authCtrl.login
);

// ✅ verify email with code
router.post(
  "/verify",
  body("email").isEmail().normalizeEmail(),
  body("code").isString().trim().isLength({ min: 4, max: 10 }),
  authCtrl.verifyEmail
);

// ✅ resend verification code
router.post(
  "/resend",
  body("email").isEmail().normalizeEmail(),
  authCtrl.resendCode
);

module.exports = router;

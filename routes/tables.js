const express = require("express");
const { body } = require("express-validator");
const tableCtrl = require("../controllers/tableController");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", tableCtrl.list);
router.get("/available", tableCtrl.available);

// admin create tables
router.post(
  "/",
  authenticate,
  requireAdmin,
  body("label").isString().trim().notEmpty(),
  body("capacity").isInt({ min: 1 }),
  body("area").optional().isIn(["main", "window", "vip"]),
  tableCtrl.create
);

module.exports = router;

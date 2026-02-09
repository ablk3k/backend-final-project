const express = require("express");
const { body } = require("express-validator");
const reservationCtrl = require("../controllers/reservationController");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// List all reservations (optional – useful for admin UI)
router.get("/", reservationCtrl.list);

// Get single reservation
router.get("/:id", reservationCtrl.get);

// Create reservation (PUBLIC – customers can reserve)
router.post(
  "/",
  body("name").isString().trim().notEmpty(),
  body("phone").isString().trim().notEmpty(),
  body("date").isString().trim().notEmpty(),
  body("time").isString().trim().notEmpty(),
  body("guests").isInt({ min: 1 }),
  body("tableId").isString().trim().notEmpty(),
  body("duration").optional().isInt({ min: 30, max: 360 }),
  reservationCtrl.create
);

// Update reservation (admin only)
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  body("name").optional().isString().trim().notEmpty(),
  body("phone").optional().isString().trim().notEmpty(),
  body("date").optional().isString().trim().notEmpty(),
  body("time").optional().isString().trim().notEmpty(),
  body("guests").optional().isInt({ min: 1 }),
  reservationCtrl.update
);

// Delete reservation (admin only)
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  reservationCtrl.remove
);

module.exports = router;

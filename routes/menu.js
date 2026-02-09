const express = require("express");
const { body } = require("express-validator");

const menuCtrl = require("../controllers/menuController");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all menu items
router.get("/", menuCtrl.list);

// Get single menu item by ID
router.get("/:id", menuCtrl.get);

// Create new menu item
router.post(
  "/",
  authenticate,
  requireAdmin,
  body("name").isString().trim().notEmpty(),
  body("description").isString().trim().notEmpty(),
  body("price").isFloat({ min: 0 }),
  body("category").isString().trim().notEmpty(),
  menuCtrl.create
);

// Update menu item
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  body("name").optional().isString().trim().notEmpty(),
  body("description").optional().isString().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }),
  body("category").optional().isString().trim().notEmpty(),
  menuCtrl.update
);

// Delete menu item
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  menuCtrl.remove
);

module.exports = router;

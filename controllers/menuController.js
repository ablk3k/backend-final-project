const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.list = async (req, res, next) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, category } = req.body;

    const it = await MenuItem.create({ name, description, price, category });
    res.status(201).json(it);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid menu item id" });

    const item = await MenuItem.findById(id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid menu item id" });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowed = ["name", "description", "price", "category"];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const item = await MenuItem.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid menu item id" });

    const item = await MenuItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

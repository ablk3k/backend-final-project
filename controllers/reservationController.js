const { validationResult } = require("express-validator");
const Reservation = require("../models/Reservation");
const Table = require("../models/Table");

function toDateTime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`);
}

exports.list = async (req, res, next) => {
  try {
    const items = await Reservation.find()
      .populate("tableId", "label capacity area")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const item = await Reservation.findById(req.params.id).populate("tableId", "label capacity area");
    if (!item) return res.status(404).json({ error: "Reservation not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone, date, time, guests, tableId } = req.body;
    const duration = Number(req.body.duration || 120);

    if (!tableId) return res.status(400).json({ error: "tableId is required" });

    const table = await Table.findById(tableId);
    if (!table || !table.isActive) return res.status(400).json({ error: "Invalid table" });

    if (Number(guests) > table.capacity) {
      return res.status(400).json({ error: `This table seats max ${table.capacity}` });
    }

    const start = toDateTime(date, time);
    if (isNaN(start.getTime())) return res.status(400).json({ error: "Invalid date/time" });

    const end = new Date(start.getTime() + duration * 60 * 1000);

    // overlap check
    const conflict = await Reservation.findOne({
      tableId,
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (conflict) {
      return res.status(409).json({ error: "This table is already booked for that time" });
    }

    const r = await Reservation.create({
      name,
      phone,
      date,
      time,
      guests,
      tableId,
      startTime: start,
      endTime: end
    });

    res.status(201).json(r);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const allowed = ["name", "phone", "date", "time", "guests"];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const item = await Reservation.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!item) return res.status(404).json({ error: "Reservation not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Reservation.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Reservation not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

const { validationResult } = require("express-validator");
const Table = require("../models/Table");
const Reservation = require("../models/Reservation");

function toDateTime(dateStr, timeStr) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:mm"
  // This uses server local time. Good enough for now; later you can add timezone.
  return new Date(`${dateStr}T${timeStr}:00`);
}

exports.list = async (req, res, next) => {
  try {
    const items = await Table.find().sort({ capacity: 1, label: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/tables/available?date=2026-02-09&time=20:00&guests=2&duration=120&area=window
exports.available = async (req, res, next) => {
  try {
    const date = String(req.query.date || "").trim();
    const time = String(req.query.time || "").trim();
    const guests = Number(req.query.guests || 0);
    const duration = Number(req.query.duration || 120);
    const area = req.query.area ? String(req.query.area).trim() : null;

    if (!date || !time || !guests) {
      return res.status(400).json({ error: "date, time, guests are required" });
    }
    if (Number.isNaN(duration) || duration < 30 || duration > 360) {
      return res.status(400).json({ error: "duration must be 30..360 minutes" });
    }

    const start = toDateTime(date, time);
    if (isNaN(start.getTime())) return res.status(400).json({ error: "Invalid date/time" });

    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Candidate tables by capacity/active/(optional area)
    const tableQuery = { isActive: true, capacity: { $gte: guests } };
    if (area) tableQuery.area = area;

    const tables = await Table.find(tableQuery).sort({ capacity: 1, label: 1 });

    if (tables.length === 0) return res.json([]);

    const tableIds = tables.map(t => t._id);

    // Find conflicting reservations:
    // overlap rule: existing.start < requested.end AND existing.end > requested.start
    const conflicts = await Reservation.find({
      tableId: { $in: tableIds },
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).select("tableId");

    const conflictSet = new Set(conflicts.map(r => String(r.tableId)));

    const available = tables.filter(t => !conflictSet.has(String(t._id)));

    res.json(
      available.map(t => ({
        _id: t._id,
        label: t.label,
        capacity: t.capacity,
        area: t.area
      }))
    );
  } catch (err) {
    next(err);
  }
};

// Admin create table
exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { label, capacity, area } = req.body;
    const t = await Table.create({ label, capacity, area });
    res.status(201).json(t);
  } catch (err) {
    next(err);
  }
};

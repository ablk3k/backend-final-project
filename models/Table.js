const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, unique: true }, // e.g. "T1"
    capacity: { type: Number, required: true, min: 1 },
    area: { type: String, enum: ["main", "window", "vip"], default: "main" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", TableSchema);

const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    // keep old fields for UI compatibility
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:mm"

    guests: { type: Number, required: true, min: 1 },

    // NEW: selected table
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },

    // NEW: for overlap checks
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    selectedItems: [
      { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }
    ]
  },
  { timestamps: true }
);

// helpful index for faster checks
ReservationSchema.index({ tableId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Reservation", ReservationSchema);

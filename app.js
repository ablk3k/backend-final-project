// app.js
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static("public"));

// Routes
const menuRoutes = require("./routes/menu");
const reservationRoutes = require("./routes/reservations");
const authRoutes = require("./routes/auth"); // ✅ MUST exist
const tableRoutes = require("./routes/tables");

app.use("/api/tables", tableRoutes);
app.use("/api/auth", authRoutes);            // ✅ MUST exist
app.use("/api/menu", menuRoutes);
app.use("/api/reservations", reservationRoutes);

app.get("/api", (req, res) => res.json({ ok: true, message: "KaRima API" }));

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;

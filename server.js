const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
}

startServer();

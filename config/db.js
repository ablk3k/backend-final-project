const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/karima";

async function connectDB() {
  const isProd = process.env.NODE_ENV === "production";

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully");
    return { inMemory: false };
  } catch (err) {
    console.error("MongoDB connection error:", err.message);

    if (isProd) {
      console.error("Production mode: refusing to start without a real database.");
      throw err; // stops server startup
    }

    console.warn("Falling back to in-memory MongoDB (development only).");

    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    console.log("Connected to in-memory MongoDB");
    return { inMemory: true, mongod };
  }
}

module.exports = connectDB;

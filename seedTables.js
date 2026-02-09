require("dotenv").config();
const connectDB = require("./config/db");
const Table = require("./models/Table");

async function seed() {
  await connectDB();

  const tables = [
    { label: "T1", capacity: 2, area: "window", isActive: true },
    { label: "T2", capacity: 2, area: "main", isActive: true },
    { label: "T3", capacity: 4, area: "main", isActive: true },
    { label: "T4", capacity: 4, area: "window", isActive: true },
    { label: "T5", capacity: 6, area: "vip", isActive: true },
  ];

  for (const t of tables) {
    await Table.updateOne({ label: t.label }, { $set: t }, { upsert: true });
  }

  console.log("✅ Tables seeded");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    console.warn("MONGODB_URI not set. Skipping DB connection.");
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error", error);
  }
}

module.exports = connectDb;

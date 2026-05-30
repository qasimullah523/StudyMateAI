import mongoose from "mongoose";
import { env } from "./env";

export async function connectDb() {
  const uri = env.mongoUri;
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

import path from "node:path";
import dotenv from "dotenv";

function normalizeList(value: string | undefined, fallback: string) {
  const raw = value && value.trim().length ? value : fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  port: Number.parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  geminiFallbackModels:
    process.env.GEMINI_FALLBACK_MODELS || "gemini-2.0-flash",
  corsOrigins: normalizeList(process.env.CORS_ORIGIN, "http://localhost:5173"),
  jsonLimit: process.env.JSON_LIMIT || "2mb",
};

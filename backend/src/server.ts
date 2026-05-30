import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import uploadRoutes from "./routes/uploadRoutes";
import aiRoutes from "./routes/aiRoutes";
import plannerRoutes from "./routes/plannerRoutes";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";

const app = express();

connectDb();

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: env.jsonLimit }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadsPath = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", aiRoutes);
app.use("/api", plannerRoutes);
app.use("/api/notes", noteRoutes);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(413)
          .json({ error: "PDF too large. Max size is 2MB." });
      }
      return res.status(400).json({ error: err.message || "Upload error" });
    }

    if (err && (err as Error).message === "Only PDF files are allowed") {
      return res.status(400).json({ error: (err as Error).message });
    }

    console.error(err);
    return res
      .status(500)
      .json({ error: (err as Error).message || "Server error" });
  },
);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

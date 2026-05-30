import { Router } from "express";
import { uploadPdf, generateAudioBook } from "../controllers/uploadController";
import upload from "../middleware/uploadMiddleware";
import { optionalAuth } from "../middleware/authMiddleware";

const router = Router();

router.post("/upload", optionalAuth, upload.single("file"), uploadPdf);
router.post(
  "/audiobook",
  optionalAuth,
  upload.single("file"),
  generateAudioBook,
);

export default router;

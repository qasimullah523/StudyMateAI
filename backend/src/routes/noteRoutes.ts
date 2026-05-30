import { Router } from "express";
import {
  listNotes,
  searchNotes,
  getStats,
  clearNotes,
} from "../controllers/noteController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAuth, listNotes);
router.get("/search", requireAuth, searchNotes);
router.get("/stats", requireAuth, getStats);
router.delete("/", requireAuth, clearNotes);

export default router;

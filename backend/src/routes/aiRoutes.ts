import { Router } from "express";
import {
  generateSummary,
  generateQuiz,
  explainSimple,
} from "../controllers/aiController";

const router = Router();

router.post("/summary", generateSummary);
router.post("/quiz", generateQuiz);
router.post("/explain", explainSimple);

export default router;

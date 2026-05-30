import { Router } from "express";
import { generatePlanner } from "../controllers/plannerController";

const router = Router();

router.post("/planner", generatePlanner);

export default router;

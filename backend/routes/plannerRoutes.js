const express = require("express");
const { generatePlanner } = require("../controllers/plannerController");

const router = express.Router();

router.post("/planner", generatePlanner);

module.exports = router;

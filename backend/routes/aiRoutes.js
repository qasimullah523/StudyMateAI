const express = require("express");
const {
  generateSummary,
  generateQuiz,
  explainSimple
} = require("../controllers/aiController");

const router = express.Router();

router.post("/summary", generateSummary);
router.post("/quiz", generateQuiz);
router.post("/explain", explainSimple);

module.exports = router;

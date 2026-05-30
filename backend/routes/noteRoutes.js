const express = require("express");
const {
  listNotes,
  searchNotes,
  getStats,
  clearNotes
} = require("../controllers/noteController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, listNotes);
router.get("/search", requireAuth, searchNotes);
router.get("/stats", requireAuth, getStats);
router.delete("/", requireAuth, clearNotes);

module.exports = router;

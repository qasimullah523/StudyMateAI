const express = require("express");
const { uploadPdf } = require("../controllers/uploadController");
const upload = require("../middleware/uploadMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/upload", optionalAuth, upload.single("file"), uploadPdf);

module.exports = router;

const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  fileName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  sourceText: { type: String },
  summary: { type: Object },
  quiz: { type: Object },
  flashcards: { type: Array },
  planner: { type: Object }
});

NoteSchema.index({ user: 1, uploadedAt: -1 });

module.exports = mongoose.model("Note", NoteSchema);

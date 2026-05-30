const fs = require("fs");
const pdfParse = require("pdf-parse");
const Note = require("../models/Note");
const {
  summarizeNotes,
  generateQuizFromNotes
} = require("../utils/gemini");

async function uploadPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(dataBuffer);
    const text = (parsed.text || "").trim();

    if (!text) {
      return res.status(422).json({ error: "Could not extract text from PDF" });
    }

    const summary = await summarizeNotes(text);
    const quiz = await generateQuizFromNotes(text);
    const flashcards = (quiz.questions || []).map((question) => ({
      question: question.question,
      answer: question.answer
    }));

    let note = null;
    if (req.user) {
      note = await Note.create({
        user: req.user._id,
        fileName: req.file.originalname,
        uploadedAt: new Date(),
        sourceText: text.slice(0, 10000),
        summary,
        quiz,
        flashcards
      });
    }

    return res.json({
      noteId: note ? note._id : null,
      fileName: req.file.originalname,
      saved: Boolean(note),
      summary,
      quiz,
      flashcards
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Upload failed" });
  }
}

module.exports = { uploadPdf };

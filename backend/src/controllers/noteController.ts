import type { Request, Response } from "express";
import Note from "../models/Note";

function escapeRegex(value: string) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapNote(note: any) {
  return {
    id: note._id,
    fileName: note.fileName,
    uploadedAt: note.uploadedAt,
    summary: note.summary,
    quiz: note.quiz,
    flashcards: note.flashcards,
  };
}

export async function listNotes(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const limit = Math.min(
    Number.parseInt(String(req.query.limit || "10"), 10) || 10,
    30,
  );
  const page = Math.max(
    Number.parseInt(String(req.query.page || "1"), 10) || 1,
    1,
  );
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };
  const [items, total] = await Promise.all([
    Note.find(query).sort({ uploadedAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments(query),
  ]);

  return res.json({
    items: items.map(mapNote),
    total,
    page,
    limit,
  });
}

export async function searchNotes(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { q } = req.query as { q?: string };
  if (!q) {
    return res.status(400).json({ error: "Query is required" });
  }

  const regex = new RegExp(escapeRegex(q), "i");
  const items = await Note.find({
    user: req.user._id,
    $or: [
      { fileName: regex },
      { "summary.shortSummary": regex },
      { "summary.keyPoints": regex },
      { "summary.keyConcepts": regex },
      { sourceText: regex },
    ],
  })
    .sort({ uploadedAt: -1 })
    .limit(20);

  return res.json({ items: items.map(mapNote) });
}

export async function getStats(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const notes = await Note.find({ user: req.user._id });
  const totalNotes = notes.length;
  const totalQuizQuestions = notes.reduce((sum, note) => {
    const count =
      note.quiz && Array.isArray(note.quiz.questions)
        ? note.quiz.questions.length
        : 0;
    return sum + count;
  }, 0);
  const totalFlashcards = notes.reduce((sum, note) => {
    const count = Array.isArray(note.flashcards) ? note.flashcards.length : 0;
    return sum + count;
  }, 0);

  const last = await Note.findOne({ user: req.user._id }).sort({
    uploadedAt: -1,
  });

  return res.json({
    totalNotes,
    totalQuizQuestions,
    totalFlashcards,
    lastUpload: last ? last.uploadedAt : null,
  });
}

export async function clearNotes(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  await Note.deleteMany({ user: req.user._id });
  return res.json({ status: "cleared" });
}

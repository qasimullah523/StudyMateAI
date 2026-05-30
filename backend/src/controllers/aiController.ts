import type { Request, Response } from "express";
import {
  summarizeNotes,
  generateQuizFromNotes,
  explainSimpleText,
} from "../utils/gemini";

export async function generateSummary(req: Request, res: Response) {
  try {
    const { text } = req.body as { text?: string };
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    const summary = await summarizeNotes(text);
    return res.json(summary);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Summary generation failed" });
  }
}

export async function generateQuiz(req: Request, res: Response) {
  try {
    const { text } = req.body as { text?: string };
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    const quiz = await generateQuizFromNotes(text);
    return res.json(quiz);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Quiz generation failed" });
  }
}

export async function explainSimple(req: Request, res: Response) {
  try {
      const { text } = req.body as { text?: string };
      console.log(text);
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
      const explanation = await explainSimpleText(text);
      console.log(explanation);
    return res.json(explanation);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Explanation failed" });
  }
}

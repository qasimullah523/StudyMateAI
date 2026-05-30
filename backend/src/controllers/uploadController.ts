import fs from "node:fs";
import path from "node:path";
import pdfParse from "pdf-parse";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { EdgeTTS } from "edge-tts-universal";
import type { Request, Response } from "express";
import Note from "../models/Note";
import {
  summarizeNotes,
  generateQuizFromNotes,
  restoreExactTextWithPunctuation,
} from "../utils/gemini";

const AUDIO_VOICE = "en-US-GuyNeural";
const MAX_TTS_CHARS = 2800;

function splitLongText(text: string, maxChars: number) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      chunks.push(current);
      current = word;
      return;
    }
    current = next;
  });

  if (current) chunks.push(current);
  return chunks;
}

function splitTextForTts(text: string, maxChars: number) {
  const clean = String(text || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (!clean) return [] as string[];
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const chunks: string[] = [];
  let current = "";

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    const next = current ? `${current} ${trimmed}` : trimmed;

    if (next.length > maxChars && current) {
      chunks.push(current);
      if (trimmed.length > maxChars) {
        chunks.push(...splitLongText(trimmed, maxChars));
        current = "";
      } else {
        current = trimmed;
      }
      return;
    }

    if (next.length > maxChars) {
      chunks.push(...splitLongText(trimmed, maxChars));
      current = "";
      return;
    }

    current = next;
  });

  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeAudio(text: string, voice: string) {
  const chunks = splitTextForTts(text, MAX_TTS_CHARS);
  if (!chunks.length) {
    return { buffer: Buffer.alloc(0), chunkCount: 0 };
  }

  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const tts = new EdgeTTS(chunk, voice);
    const result = await tts.synthesize();
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    buffers.push(audioBuffer);
  }

  return { buffer: Buffer.concat(buffers), chunkCount: chunks.length };
}

export async function uploadPdf(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const dataBuffer = await fs.promises.readFile(req.file.path);
    const text = String((await extractTextFromPdf(dataBuffer)) || "").trim();

    if (!text) {
      return res.status(422).json({ error: "Could not extract text from PDF" });
    }

    const summary = await summarizeNotes(text);
    const quiz = await generateQuizFromNotes(text);
    const flashcards = (quiz.questions || []).map((question: any) => ({
      question: question.question,
      answer: question.answer,
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
        flashcards,
      });
    }

    return res.json({
      noteId: note ? note._id : null,
      fileName: req.file.originalname,
      saved: Boolean(note),
      summary,
      quiz,
      flashcards,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Upload failed" });
  }
}

export async function generateAudioBook(req: Request, res: Response) {
  const cleanup = async () => {
    if (req.file && req.file.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (error) {
        console.warn(
          "Could not delete uploaded PDF",
          (error as Error).message || error,
        );
      }
    }
  };

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const dataBuffer = await fs.promises.readFile(req.file.path);
    const rawText = String((await extractTextFromPdf(dataBuffer)) || "").trim();

    if (!rawText) {
      return res.status(422).json({ error: "Could not extract text from PDF" });
    }

    const aiResult = await restoreExactTextWithPunctuation(rawText, {
      maxChunkChars: 2000,
    });
    const textForAudio =
      aiResult.text && aiResult.text.trim() ? aiResult.text : rawText;

    const { buffer, chunkCount } = await synthesizeAudio(
      textForAudio,
      AUDIO_VOICE,
    );
    if (!buffer.length) {
      return res.status(500).json({ error: "Audio generation failed" });
    }

    const baseName = path
      .parse(req.file.originalname)
      .name.replace(/[^A-Za-z0-9_-]+/g, "_")
      .slice(0, 64);
    const audioFileName = `audiobook-${Date.now()}-${baseName || "notes"}.mp3`;
    const audioPath = path.resolve(process.cwd(), "uploads", audioFileName);
    await fs.promises.writeFile(audioPath, buffer);

    return res.json({
      fileName: req.file.originalname,
      audioUrl: `/uploads/${audioFileName}`,
      voice: AUDIO_VOICE,
      textLength: textForAudio.length,
      chunkCount,
      usedAi: aiResult.usedAi,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: (error as Error).message || "Audio generation failed" });
  } finally {
    await cleanup();
  }
}

async function extractTextFromPdf(dataBuffer: Buffer) {
  try {
    const parsed = await pdfParse(dataBuffer);
    if (parsed && parsed.text && parsed.text.trim()) return parsed.text;
  } catch (error) {
    console.warn(
      "pdf-parse failed, falling back to pdfjs-dist:",
      (error as Error).message,
    );
  }

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(dataBuffer),
    }) as any;
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((it: any) => (it.str ? it.str : ""))
        .join(" ");
      fullText += `${strings}\n`;
    }
    if (fullText && fullText.trim()) return fullText;
  } catch (error) {
    console.warn(
      "pdfjs-dist extraction failed:",
      (error as Error).message || error,
    );
  }

  return "";
}

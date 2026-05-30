import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";

const primaryModel = env.geminiModel;
const fallbackModels = env.geminiFallbackModels
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

function getModel(modelName: string) {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

function isRetryable(error: unknown) {
  const message = String((error as Error)?.message || "");
  return /429|503|temporarily|high demand|rate limit/i.test(message);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModel(prompt: string, modelName: string) {
  const model = getModel(modelName);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateStreamWithModel(
  prompt: string,
  modelName: string,
  onChunk?: (chunk: string) => void,
) {
  const model = getModel(modelName);
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text =
      typeof chunk.text === "function" ? chunk.text() : (chunk.text as string);
    if (text && typeof onChunk === "function") {
      onChunk(text);
    }
  }
}

async function generateText(prompt: string) {
  const modelsToTry = [primaryModel, ...fallbackModels];
  let lastError: unknown;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await generateWithModel(prompt, modelName);
      } catch (error) {
        lastError = error;
        if (isRetryable(error) && attempt === 0) {
          await delay(600);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("Gemini request failed");
}

async function generateTextStream(
  prompt: string,
  onChunk?: (chunk: string) => void,
) {
  const modelsToTry = [primaryModel, ...fallbackModels];
  let lastError: unknown;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let didEmit = false;
      const emit = (chunk: string) => {
        didEmit = true;
        if (typeof onChunk === "function") {
          onChunk(chunk);
        }
      };

      try {
        await generateStreamWithModel(prompt, modelName, emit);
        return;
      } catch (error) {
        lastError = error;
        if (didEmit) {
          throw error;
        }
        if (isRetryable(error) && attempt === 0) {
          await delay(600);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("Gemini stream failed");
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

function extractJson(text: string) {
  if (!text) return null;
  const direct = safeJsonParse(text);
  if (direct) return direct;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return safeJsonParse(text.slice(start, end + 1));
  }
  return null;
}

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

function splitTextBySentence(text: string, maxChars: number) {
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

function getWordTokens(text: string) {
  return String(text || "").match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) || [];
}

function hasSameWordSequence(source: string, candidate: string) {
  const sourceWords = getWordTokens(source);
  const candidateWords = getWordTokens(candidate);
  if (sourceWords.length !== candidateWords.length) return false;
  for (let i = 0; i < sourceWords.length; i += 1) {
    if (sourceWords[i] !== candidateWords[i]) return false;
  }
  return true;
}

export async function restoreExactTextWithPunctuation(
  text: string,
  options: { maxChunkChars?: number } = {},
) {
  const maxChunkChars = options.maxChunkChars || 2000;
  const chunks = splitTextBySentence(text, maxChunkChars);
  const restored: string[] = [];
  let usedAi = false;

  for (const chunk of chunks) {
    if (!chunk.trim()) {
      restored.push(chunk);
      continue;
    }

    const prompt = [
      "Return the exact same text as input. Do not paraphrase or reorder anything.",
      "Only restore missing punctuation or spacing if needed.",
      "If you are unsure, return the input unchanged.",
      "Text:",
      chunk,
    ].join("\n");

    try {
      const raw = await generateText(prompt);
      usedAi = true;
      const candidate = String(raw || "").trim();
      if (!candidate) {
        restored.push(chunk);
        continue;
      }
      if (!hasSameWordSequence(chunk, candidate)) {
        restored.push(chunk);
        continue;
      }
      restored.push(candidate);
    } catch (_error) {
      restored.push(chunk);
    }
  }

  return {
    text: restored
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim(),
    usedAi,
  };
}

export async function summarizeNotes(text: string) {
  const prompt = [
    "Summarize these notes for a university student.",
    "Return JSON only with keys:",
    "shortSummary (string), keyPoints (array of strings), keyConcepts (array of strings), formulas (array of strings).",
    "Notes:",
    text,
  ].join("\n");

  const raw = await generateText(prompt);
  const parsed = extractJson(raw);
  if (parsed) return parsed;
  return {
    shortSummary: raw.trim(),
    keyPoints: [],
    keyConcepts: [],
    formulas: [],
  };
}

export async function generateQuizFromNotes(text: string) {
  const prompt = [
    "Generate 5 MCQs from these notes.",
    "Return JSON only with key: questions (array).",
    "Each question: question (string), options (array of 4 strings), answer (string).",
    "Notes:",
    text,
  ].join("\n");

  const raw = await generateText(prompt);
  const parsed = extractJson(raw);
  if (parsed && parsed.questions) return parsed;
  return { questions: [] };
}

export async function explainSimpleText(text: string) {
  const prompt = [
    "Explain this topic in beginner-friendly language.",
    "Be clear and complete. Use as much detail as needed.",
    "Topic:",
    text,
  ].join("\n");

  const raw = await generateText(prompt);
  return { explanation: raw.trim() };
}

export async function explainSimpleStream(
  text: string,
  onChunk?: (chunk: string) => void,
) {
  const prompt = [
    "Explain this topic in beginner-friendly language.",
    "Be clear and complete. Use as much detail as needed.",
    "Topic:",
    text,
  ].join("\n");

  await generateTextStream(prompt, onChunk);
}

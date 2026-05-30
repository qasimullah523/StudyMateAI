const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || "";
// const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const primaryModel = "gemini-3.5-flash"
const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS || "gemini-2.0-flash")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

function getModel(modelName) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

function isRetryable(error) {
  const message = String(error && error.message ? error.message : "");
  return /429|503|temporarily|high demand|rate limit/i.test(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithModel(prompt, modelName) {
  const model = getModel(modelName);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateStreamWithModel(prompt, modelName, onChunk) {
  const model = getModel(modelName);
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = typeof chunk.text === "function" ? chunk.text() : chunk.text;
    if (text && typeof onChunk === "function") {
      onChunk(text);
    }
  }
}

async function generateText(prompt) {
  const modelsToTry = [primaryModel, ...fallbackModels];
  let lastError;

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

async function generateTextStream(prompt, onChunk) {
  const modelsToTry = [primaryModel, ...fallbackModels];
  let lastError;

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let didEmit = false;
      const emit = (chunk) => {
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

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function extractJson(text) {
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

async function summarizeNotes(text) {
  const prompt = [
    "Summarize these notes for a university student.",
    "Return JSON only with keys:",
    "shortSummary (string), keyPoints (array of strings), keyConcepts (array of strings), formulas (array of strings).",
    "Notes:",
    text
  ].join("\n");

  const raw = await generateText(prompt);
  const parsed = extractJson(raw);
  if (parsed) return parsed;
  return { shortSummary: raw.trim(), keyPoints: [], keyConcepts: [], formulas: [] };
}

async function generateQuizFromNotes(text) {
  const prompt = [
    "Generate 5 MCQs from these notes.",
    "Return JSON only with key: questions (array).",
    "Each question: question (string), options (array of 4 strings), answer (string).",
    "Notes:",
    text
  ].join("\n");

  const raw = await generateText(prompt);
  const parsed = extractJson(raw);
  if (parsed && parsed.questions) return parsed;
  return { questions: [] };
}

async function explainSimpleText(text) {
  const prompt = [
    "Explain this topic in beginner-friendly language.",
    "Be clear and complete. Use as much detail as needed.",
    "Topic:",
    text
  ].join("\n");

  const raw = await generateText(prompt);
  return { explanation: raw.trim() };
}

async function explainSimpleStream(text, onChunk) {
  const prompt = [
    "Explain this topic in beginner-friendly language.",
    "Be clear and complete. Use as much detail as needed.",
    "Topic:",
    text
  ].join("\n");

  await generateTextStream(prompt, onChunk);
}

module.exports = {
  summarizeNotes,
  generateQuizFromNotes,
  explainSimpleText,
  explainSimpleStream
};

const {
  summarizeNotes,
  generateQuizFromNotes,
  explainSimpleText
} = require("../utils/gemini");

async function generateSummary(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    const summary = await summarizeNotes(text);
    return res.json(summary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Summary generation failed" });
  }
}

async function generateQuiz(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    const quiz = await generateQuizFromNotes(text);
    return res.json(quiz);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Quiz generation failed" });
  }
}

async function explainSimple(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    const explanation = await explainSimpleText(text);
    return res.json(explanation);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Explanation failed" });
  }
}

module.exports = {
  generateSummary,
  generateQuiz,
  explainSimple
};

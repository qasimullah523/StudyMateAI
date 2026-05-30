import { useState } from "react";
import PageShell from "../components/PageShell";
import { apiFetch } from "../lib/api";
import { getLast, saveLast } from "../lib/storage";
import type { Quiz } from "../lib/types";

export default function QuizPage() {
  const [text, setText] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setStatus("Paste notes first.");
      return;
    }

    setLoading(true);
    setStatus("Generating quiz...");

    try {
      const response = await apiFetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Quiz generation failed");
      }
      setQuiz(data);
      saveLast({ quiz: data });
      setStatus("Quiz ready.");
    } catch (error) {
      setStatus((error as Error).message || "Quiz generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLast = () => {
    const last = getLast<{ quiz?: Quiz }>();
    if (last?.quiz) {
      setQuiz(last.quiz);
      setStatus("Loaded last quiz.");
    } else {
      setStatus("No saved quiz yet.");
    }
  };

  return (
    <PageShell
      title="Generate a quiz"
      subtitle="Paste notes or load the last upload."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="glass-card p-6">
          <label className="text-sm font-semibold text-slate-700">
            Paste notes text
          </label>
          <textarea
            className="mt-3 w-full rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-sm"
            rows={10}
            placeholder="Paste your notes here..."
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-5 py-2 text-sm font-semibold text-slate-900"
              onClick={handleGenerate}
              type="button"
              disabled={loading}
            >
              Generate Quiz
            </button>
            <button
              className="rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-700"
              onClick={handleLoadLast}
              type="button"
            >
              Use Last Upload
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {loading ? "Generating..." : status}
          </p>
        </div>

        <div className="glass-card p-6">
          <h3 className="heading-font text-lg">Quiz results</h3>
          <div className="mt-4 space-y-4">
            {(quiz?.questions || []).map((question, index) => (
              <QuizCard
                key={`quiz-${index}`}
                index={index}
                question={question}
              />
            ))}
            {!quiz?.questions?.length && (
              <p className="text-sm text-slate-500">No questions yet.</p>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function QuizCard({
  question,
  index,
}: {
  question: { question: string; options: string[]; answer: string };
  index: number;
}) {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600">
          Q{index + 1}
        </span>
        <button
          className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600"
          onClick={() => setReveal((value) => !value)}
          type="button"
        >
          Reveal
        </button>
      </div>
      <h4 className="mt-3 text-sm font-semibold text-slate-700">
        {question.question}
      </h4>
      <ul className="mt-3 space-y-2 text-sm text-slate-500">
        {question.options.map((option) => (
          <li
            key={option}
            className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2"
          >
            {option}
          </li>
        ))}
      </ul>
      {reveal && (
        <div className="mt-3 rounded-xl border border-emerald-200/70 bg-emerald-100/60 px-3 py-2 text-xs font-semibold text-emerald-700">
          Answer: {question.answer}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import PageShell from "../components/PageShell";
import { apiFetch, apiUrl } from "../lib/api";
import { DEMO_QUIZ, DEMO_SUMMARY } from "../lib/demo";
import {
  clearHistory,
  getHistory,
  getLast,
  getToken,
  saveHistory,
  saveLast,
} from "../lib/storage";
import type { Flashcard, NoteItem, Quiz, Summary } from "../lib/types";
import { useAuth } from "../state/AuthContext";
import {
  FaBolt,
  FaFileArrowUp,
  FaHeadphonesSimple,
  FaPaperclip,
} from "react-icons/fa6";

const MAX_PDF_BYTES = 2 * 1024 * 1024;

interface ChatMessage {
  role: "ai" | "user" | "system";
  text: string;
}

function renderMarkdown(text: string) {
  const raw = text || "";
  const html = marked.parse(raw, { breaks: true, gfm: true }) as string;
  return { __html: DOMPurify.sanitize(html) };
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function Upload() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Upload a PDF or ask a quick question. I will respond right here.",
    },
  ]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [history, setHistory] = useState<NoteItem[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const [uploadStatus, setUploadStatus] = useState("");
  const [audioStatus, setAudioStatus] = useState("");
  const [askStatus, setAskStatus] = useState("");

  const [uploadLoading, setUploadLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [askLoading, setAskLoading] = useState(false);

  const [audioUrl, setAudioUrl] = useState("");
  const [audioMeta, setAudioMeta] = useState("");

  const askRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const summaryContext = useMemo(() => {
    if (!summary) return "";
    const segments = [
      summary.shortSummary ? `Summary: ${summary.shortSummary}` : "",
      summary.keyPoints?.length
        ? `Key points: ${summary.keyPoints.join("; ")}`
        : "",
      summary.keyConcepts?.length
        ? `Key concepts: ${summary.keyConcepts.join("; ")}`
        : "",
      summary.formulas?.length
        ? `Formulas: ${summary.formulas.join("; ")}`
        : "",
    ].filter(Boolean);
    return segments.join("\n");
  }, [summary]);

  useEffect(() => {
    const last = getLast<{ summary?: Summary; quiz?: Quiz }>();
    if (last?.summary) setSummary(last.summary);
    if (last?.quiz) {
      setQuiz(last.quiz);
      setFlashcards(
        last.quiz.questions?.map((q) => ({
          question: q.question,
          answer: q.answer,
        })) || [],
      );
    }
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setHistory(getHistory() as NoteItem[]);
        return;
      }
      try {
        const response = await apiFetch("/api/notes?limit=8");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load history");
        }
        setHistory(data.items || []);
      } catch (_error) {
        setHistory(getHistory() as NoteItem[]);
      }
    };

    void loadHistory();
  }, [user]);

  const appendMessage = (role: ChatMessage["role"], text: string) => {
    setMessages((current) => [...current, { role, text }]);
  };

  const validatePdf = (
    selected: File | null | undefined,
    setStatus: (value: string) => void,
  ) => {
    if (!selected) {
      setStatus("Please choose a PDF first.");
      return false;
    }
    if (selected.type !== "application/pdf") {
      setStatus("Only PDF files are allowed.");
      return false;
    }
    if (selected.size > MAX_PDF_BYTES) {
      setStatus("PDF too large. Max size is 2MB.");
      return false;
    }
    return true;
  };

  const handleFileChange = (selected?: File | null) => {
    if (!selected) {
      setFile(null);
      setFileName("");
      return;
    }

    if (!validatePdf(selected, setUploadStatus)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      setFileName("");
      return;
    }

    setFile(selected);
    setFileName(selected.name);
    setUploadStatus("PDF selected. Click Analyze or Audio book.");
    setAudioStatus("");
    setAudioUrl("");
    setAudioMeta("");
  };

  const handleUpload = async () => {
    if (!validatePdf(file, setUploadStatus)) return;

    setUploadLoading(true);
    setUploadStatus("Uploading and analyzing...");
    appendMessage("system", `Uploading ${file?.name || "file"}...`);

    try {
      const formData = new FormData();
      formData.append("file", file as File);

      const response = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSummary(data.summary);
      setQuiz(data.quiz);
      setFlashcards(
        (data.quiz?.questions || []).map((question: any) => ({
          question: question.question,
          answer: question.answer,
        })),
      );

      const payload = {
        fileName: data.fileName || file?.name,
        summary: data.summary,
        quiz: data.quiz,
        createdAt: new Date().toISOString(),
      };
      saveLast(payload);

      if (getToken()) {
        const responseHistory = await apiFetch("/api/notes?limit=8");
        const historyData = await responseHistory.json();
        if (responseHistory.ok) {
          setHistory(historyData.items || []);
        }
      } else {
        saveHistory(payload);
        setHistory(getHistory() as NoteItem[]);
      }

      if (!data.saved && !getToken()) {
        setUploadStatus("Summary ready. Sign in to save history.");
      } else {
        setUploadStatus("Done. Summary and quiz ready.");
      }

      appendMessage(
        "system",
        `Summary and quiz ready for ${payload.fileName}.`,
      );
    } catch (error) {
      appendMessage("system", (error as Error).message || "Upload failed");
      setUploadStatus((error as Error).message || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAudio = async () => {
    if (!validatePdf(file, setAudioStatus)) return;
    setAudioLoading(true);
    setAudioStatus("Generating audio book...");
    appendMessage(
      "system",
      `Generating audio book for ${file?.name || "file"}...`,
    );

    try {
      const formData = new FormData();
      formData.append("file", file as File);

      const response = await apiFetch("/api/audiobook", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Audio generation failed");
      }

      const resolvedUrl = data.audioUrl?.startsWith("http")
        ? data.audioUrl
        : apiUrl(data.audioUrl || "");

      setAudioUrl(resolvedUrl);
      setAudioMeta(
        [
          data.voice || "English male",
          data.textLength ? `${data.textLength} chars` : "",
          data.usedAi ? "AI punctuation" : "raw text",
        ]
          .filter(Boolean)
          .join(" • "),
      );
      setAudioStatus("Audio book ready.");
      appendMessage(
        "system",
        `Audio book ready for ${data.fileName || file?.name}.`,
      );
    } catch (error) {
      appendMessage(
        "system",
        (error as Error).message || "Audio generation failed",
      );
      setAudioStatus((error as Error).message || "Audio generation failed");
    } finally {
      setAudioLoading(false);
    }
  };

  const handleAsk = async () => {
    const question = askRef.current?.value.trim() || "";
    if (!question) {
      setAskStatus("Type a question first.");
      return;
    }

    appendMessage("user", question);
    setAskLoading(true);
    setAskStatus("Thinking...");

    try {
      const payload = {
        text: [
          summaryContext ? `Context:\n${summaryContext}` : "",
          `Question: ${question}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      };

      const response = await apiFetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI request failed");
      }

      const answer = (data.explanation || "").trim();
      appendMessage("ai", answer || "No response yet.");
      setAskStatus("Answer ready.");
    } catch (error) {
      appendMessage("system", (error as Error).message || "AI request failed");
      setAskStatus((error as Error).message || "AI request failed");
    } finally {
      setAskLoading(false);
    }
  };

  const handleDemo = () => {
    setSummary(DEMO_SUMMARY);
    setQuiz(DEMO_QUIZ);
    setFlashcards(
      DEMO_QUIZ.questions.map((question) => ({
        question: question.question,
        answer: question.answer,
      })),
    );
    const payload = {
      fileName: "Demo Notes",
      summary: DEMO_SUMMARY,
      quiz: DEMO_QUIZ,
      createdAt: new Date().toISOString(),
    };
    saveLast(payload);
    if (getToken()) {
      setUploadStatus("Demo loaded. Ready to present.");
    } else {
      saveHistory(payload);
      setHistory(getHistory() as NoteItem[]);
      setUploadStatus("Demo loaded. Ready to present.");
    }
    appendMessage("system", "Demo notes loaded.");
  };

  const handleHistoryLoad = (item: NoteItem) => {
    if (item.summary) setSummary(item.summary);
    if (item.quiz) {
      setQuiz(item.quiz);
      setFlashcards(
        item.quiz.questions?.map((question) => ({
          question: question.question,
          answer: question.answer,
        })) || [],
      );
    }
    setUploadStatus("Loaded from history.");
  };

  const handleClearHistory = async () => {
    if (getToken()) {
      try {
        const response = await apiFetch("/api/notes", { method: "DELETE" });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Could not clear history");
        }
        setHistory([]);
        setUploadStatus("History cleared.");
        return;
      } catch (error) {
        setUploadStatus((error as Error).message || "Could not clear history");
      }
    }

    clearHistory();
    setHistory([]);
    setUploadStatus("History cleared.");
  };

  return (
    <PageShell
      title="Upload your notes"
      subtitle="Drop a PDF and get summary + quiz instantly."
      compactHeader
    >
      <div className="grid gap-6">
        <section
          className="grid gap-4 glass-card p-5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const dropped = event.dataTransfer.files?.[0];
            handleFileChange(dropped || null);
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="heading-font text-lg">StudyMate chat</h3>
              <p className="text-sm text-slate-500">
                Upload a PDF or ask a quick question.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <FaPaperclip />
              </button>
              <button
                className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm"
                onClick={() => imageInputRef.current?.click()}
                type="button"
              >
                <FaBolt />
              </button>
              <button
                className="rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 text-sm"
                onClick={handleDemo}
                type="button"
              >
                Demo
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message ${message.role}`}
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {message.role === "user"
                    ? "You"
                    : message.role === "system"
                      ? "System"
                      : "StudyMate"}
                </div>
                <div
                  className="mt-2 text-sm text-slate-700"
                  dangerouslySetInnerHTML={renderMarkdown(message.text)}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(event) =>
                  handleFileChange(event.target.files?.[0] || null)
                }
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={() => {
                  setAskStatus(
                    "Image attached (beta). Ask a question to proceed.",
                  );
                  appendMessage(
                    "system",
                    "Image attached (beta). Ask a question to proceed.",
                  );
                }}
              />
              <div className="text-sm text-slate-500">
                {fileName
                  ? `Selected: ${fileName}`
                  : "Drop a PDF or click the paperclip to attach."}
              </div>
            </div>
            <textarea
              ref={askRef}
              className="w-full rounded-xl border border-slate-200/70 bg-white/80 p-3 text-sm"
              rows={2}
              placeholder="Ask StudyMate (short question works best)"
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700"
                onClick={handleUpload}
                type="button"
                disabled={uploadLoading}
              >
                <FaFileArrowUp className="inline mr-1" /> Analyze
              </button>
              <button
                className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700"
                onClick={handleAudio}
                type="button"
                disabled={audioLoading}
              >
                <FaHeadphonesSimple className="inline mr-1" /> Audio book
              </button>
              <button
                className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-2 text-xs font-semibold text-slate-900"
                onClick={handleAsk}
                type="button"
                disabled={askLoading}
              >
                Send
              </button>
              <button
                className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700"
                onClick={() => {
                  if (askRef.current) askRef.current.value = "";
                  setAskStatus("");
                }}
                type="button"
              >
                Clear
              </button>
            </div>
            <div className="text-xs text-slate-500">
              {uploadLoading && "Analyzing PDF..."}
              {!uploadLoading && uploadStatus}
            </div>
            <div className="text-xs text-slate-500">
              {audioLoading && "Generating audio..."}
              {!audioLoading && audioStatus}
            </div>
            <div className="text-xs text-slate-500">
              {askLoading && "Thinking..."}
              {!askLoading && askStatus}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="heading-font text-lg">Summary</h3>
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600">
                AI Output
              </span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-700">
                  Short summary
                </h4>
                <p className="mt-2 text-sm text-slate-500">
                  {summary?.shortSummary || "No summary yet."}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">
                    Important points
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-500">
                    {(summary?.keyPoints || []).map((item, index) => (
                      <li key={`point-${index}`}>{item}</li>
                    ))}
                    {!summary?.keyPoints?.length && <li>No items yet.</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">
                    Key concepts
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-slate-500">
                    {(summary?.keyConcepts || []).map((item, index) => (
                      <li key={`concept-${index}`}>{item}</li>
                    ))}
                    {!summary?.keyConcepts?.length && <li>No items yet.</li>}
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">
                  Important formulas
                </h4>
                <ul className="mt-2 space-y-2 text-sm text-emerald-600">
                  {(summary?.formulas || []).map((item, index) => (
                    <li key={`formula-${index}`}>{item}</li>
                  ))}
                  {!summary?.formulas?.length && (
                    <li className="text-slate-500">No formulas yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="heading-font text-lg">Quiz</h3>
              <span className="text-xs text-slate-500">MCQs</span>
            </div>
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
        </section>

        <section className="glass-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="heading-font text-lg">Flashcards</h3>
            <span className="text-xs text-slate-500">Tap to flip</span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flashcards.map((card, index) => (
              <FlashcardItem key={`flash-${index}`} card={card} />
            ))}
            {!flashcards.length && (
              <p className="text-sm text-slate-500">No flashcards yet.</p>
            )}
          </div>
        </section>

        <section className="glass-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="heading-font text-lg">Audio book</h3>
            <span className="text-xs text-slate-500">English male voice</span>
          </div>
          <div className="mt-4 space-y-3">
            <audio className="w-full" controls src={audioUrl} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">{audioMeta}</span>
              {audioUrl && (
                <a
                  className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700"
                  href={audioUrl}
                  download
                >
                  Download MP3
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="glass-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="heading-font text-lg">Study history</h3>
              <p className="text-sm text-slate-500">
                Saved sessions from this browser.
              </p>
            </div>
            <button
              className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700"
              onClick={handleClearHistory}
              type="button"
            >
              Clear
            </button>
          </div>
          <ul className="mt-4 grid gap-3">
            {history.map((item) => (
              <li
                key={item.id || item.fileName}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    {item.fileName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(
                      item.uploadedAt ||
                        (item as { createdAt?: string }).createdAt,
                    )}
                  </div>
                </div>
                <button
                  className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700"
                  onClick={() => handleHistoryLoad(item)}
                  type="button"
                >
                  Load
                </button>
              </li>
            ))}
            {!history.length && (
              <li className="text-sm text-slate-500">No saved sessions yet.</li>
            )}
          </ul>
        </section>
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

function FlashcardItem({ card }: { card: Flashcard }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`flashcard ${flipped ? "is-flipped" : ""}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="flashcard-inner">
        <div className="flashcard-face">
          <strong className="text-xs uppercase tracking-[0.1em] text-sky-500">
            Question
          </strong>
          <div className="text-sm text-slate-700">{card.question}</div>
        </div>
        <div className="flashcard-face flashcard-back">
          <strong className="text-xs uppercase tracking-[0.1em] text-emerald-600">
            Answer
          </strong>
          <div className="text-sm text-slate-700">{card.answer}</div>
        </div>
      </div>
    </div>
  );
}

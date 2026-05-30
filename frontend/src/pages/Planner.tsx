import { useState } from "react";
import PageShell from "../components/PageShell";
import { apiFetch } from "../lib/api";
import type { PlannerPlan } from "../lib/types";

export default function Planner() {
  const [subjects, setSubjects] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [difficulty, setDifficulty] = useState("medium");
  const [plan, setPlan] = useState<PlannerPlan | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subjects.trim()) {
      setStatus("Add at least one subject.");
      return;
    }

    setLoading(true);
    setStatus("Building plan...");

    try {
      const response = await apiFetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          examDate: examDate || null,
          hoursPerDay,
          overallDifficulty: difficulty,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Planner failed");
      }
      setPlan(data);
      setStatus("Plan ready.");
    } catch (error) {
      setStatus((error as Error).message || "Planner failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Smart study planner"
      subtitle="Add subjects and get a daily schedule. Use format: Math(hard), DSA(medium), OS(easy)."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="glass-card p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Subjects
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                placeholder="Math(hard), DSA(medium), OS(easy)"
                value={subjects}
                onChange={(event) => setSubjects(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Exam date
              </label>
              <input
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                value={examDate}
                onChange={(event) => setExamDate(event.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Hours per day
              </label>
              <input
                type="number"
                min={1}
                max={12}
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                value={hoursPerDay}
                onChange={(event) => setHoursPerDay(Number(event.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Overall difficulty
              </label>
              <select
                className="mt-2 w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <button
              className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-5 py-2 text-sm font-semibold text-slate-900"
              type="submit"
              disabled={loading}
            >
              Generate Plan
            </button>
            <p className="text-xs text-slate-500">
              {loading ? "Generating..." : status}
            </p>
          </form>
        </div>

        <div className="grid gap-4">
          {plan?.schedule?.map((day) => (
            <div key={day.label} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">
                  {day.label}
                </h4>
                <span className="text-xs text-slate-500">{day.date}</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-500">
                {day.sessions.map((session) => (
                  <li key={`${day.label}-${session.subject}`}>
                    {session.subject} - {session.hours}h
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!plan?.schedule?.length && (
            <div className="glass-card p-6 text-sm text-slate-500">
              No plan generated.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

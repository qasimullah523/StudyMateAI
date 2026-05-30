import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { apiFetch } from "../lib/api";
import type { NoteItem } from "../lib/types";
import { useAuth } from "../state/AuthContext";

interface Stats {
  totalNotes: number;
  totalQuizQuestions: number;
  totalFlashcards: number;
  lastUpload?: string | null;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<NoteItem[]>([]);
  const [searchResults, setSearchResults] = useState<NoteItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const response = await apiFetch("/api/notes/stats");
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        }
      } catch (_error) {
        setStats(null);
      }
    };

    const loadRecent = async () => {
      if (!user) return;
      try {
        const response = await apiFetch("/api/notes?limit=6");
        const data = await response.json();
        if (response.ok) {
          setRecent(data.items || []);
        }
      } catch (_error) {
        setRecent([]);
      }
    };

    void loadStats();
    void loadRecent();
  }, [user]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiFetch(
        `/api/notes/search?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }
      setSearchResults(data.items || []);
    } catch (_error) {
      setSearchResults([]);
    }
  };

  return (
    <PageShell title="Dashboard" subtitle="Quick stats and saved notes.">
      {!user && (
        <div className="glass-card p-6 text-sm text-slate-500">
          Sign in to view your learning dashboard.
        </div>
      )}

      {user && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Notes saved" value={stats?.totalNotes ?? "-"} />
            <StatCard
              label="Quiz questions"
              value={stats?.totalQuizQuestions ?? "-"}
            />
            <StatCard
              label="Flashcards"
              value={stats?.totalFlashcards ?? "-"}
            />
            <StatCard
              label="Last upload"
              value={formatDate(stats?.lastUpload)}
              small
            />
          </section>

          <section className="glass-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="heading-font text-lg">Search notes</h3>
                <p className="text-sm text-slate-500">
                  Find summaries or concepts quickly.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-2">
                <input
                  className="w-56 bg-transparent text-sm text-slate-700 focus:outline-none"
                  placeholder="Search by keyword..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button
                  className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-2 text-xs font-semibold text-slate-900"
                  onClick={handleSearch}
                  type="button"
                >
                  Search
                </button>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              {searchResults.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <div className="font-semibold text-slate-700">
                    {item.fileName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(item.uploadedAt)}
                  </div>
                </li>
              ))}
              {!searchResults.length && <li>No results</li>}
            </ul>
          </section>

          <section className="glass-card p-6">
            <div>
              <h3 className="heading-font text-lg">Recent notes</h3>
              <p className="text-sm text-slate-500">
                Latest uploads from your account.
              </p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-500">
              {recent.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3"
                >
                  <div className="font-semibold text-slate-700">
                    {item.fileName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(item.uploadedAt)}
                  </div>
                </li>
              ))}
              {!recent.length && <li>No recent notes yet.</li>}
            </ul>
          </section>
        </div>
      )}
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div
        className={`mt-3 font-semibold text-slate-800 ${small ? "text-lg" : "text-3xl"}`}
      >
        {value}
      </div>
    </div>
  );
}

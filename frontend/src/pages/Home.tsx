import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaBolt, FaCalendarCheck, FaClipboardCheck } from "react-icons/fa6";
import PageShell from "../components/PageShell";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";

export default function Home() {
  const [searchParams] = useSearchParams();
  const [showAuth, setShowAuth] = useState(false);
  const { register, login } = useAuth();
  const { setTheme } = useTheme();
  const [registerStatus, setRegisterStatus] = useState("");
  const [loginStatus, setLoginStatus] = useState("");

  const authRequested = useMemo(
    () => searchParams.get("auth") === "1",
    [searchParams],
  );

  useEffect(() => {
    setShowAuth(authRequested);
  }, [authRequested]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = (
      form.elements.namedItem("name") as HTMLInputElement
    ).value.trim();
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const password = (
      form.elements.namedItem("password") as HTMLInputElement
    ).value.trim();

    if (!name || !email || !password) {
      setRegisterStatus("Please fill in all fields.");
      return;
    }

    const result = await register(name, email, password);
    if (!result.ok) {
      setRegisterStatus(result.error || "Registration failed");
      return;
    }

    if (result.user?.preferences?.theme) {
      setTheme(result.user.preferences.theme);
    }
    setRegisterStatus("Account created. You are signed in.");
    setLoginStatus("");
    form.reset();
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const password = (
      form.elements.namedItem("password") as HTMLInputElement
    ).value.trim();

    if (!email || !password) {
      setLoginStatus("Enter your email and password.");
      return;
    }

    const result = await login(email, password);
    if (!result.ok) {
      setLoginStatus(result.error || "Login failed");
      return;
    }

    if (result.user?.preferences?.theme) {
      setTheme(result.user.preferences.theme);
    }
    setLoginStatus("Logged in successfully.");
    setRegisterStatus("");
    form.reset();
  };

  return (
    <PageShell
      title="Home"
      compactHeader
      onAccountClick={() => setShowAuth((current) => !current)}
    >
      <section className="fade-up">
        <div className="grid gap-8 lg:grid-cols-[minmax(280px,1.1fr)_minmax(280px,0.9fr)] lg:items-center">
          <div className="space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              AI study studio
            </span>
            <h2 className="heading-font text-3xl sm:text-4xl">
              Short, focused learning flows for every class.
            </h2>
            <p className="text-sm text-slate-500 max-w-xl">
              Upload notes or ask a quick question. StudyMate turns your
              material into summaries, quizzes, and a weekly plan in minutes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/20"
                to="/upload"
              >
                Start with a PDF
              </Link>
              <Link
                className="rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-700"
                to="/dashboard"
              >
                View progress
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600">
                <FaBolt className="text-sky-500" /> Fast summaries
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600">
                <FaClipboardCheck className="text-emerald-500" /> Smart quizzes
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600">
                <FaCalendarCheck className="text-amber-500" /> Weekly plan
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/60 shadow-xl">
              <img
                src="/nick-morrison-FHnnjk1Yj7Y-unsplash.jpg"
                alt="Student studying with a laptop"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-4 glass-card px-4 py-3 text-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Today&apos;s goal
              </div>
              <div className="mt-1 font-semibold text-slate-700">
                Review 2 chapters, 10 flashcards, 1 quiz.
              </div>
            </div>
          </div>
        </div>
      </section>

      {showAuth && (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="heading-font text-2xl">Client account</h3>
              <p className="text-sm text-slate-500">
                Register and login for the demo experience.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6">
              <h4 className="text-lg font-semibold text-slate-800">
                Create account
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                Save your last summary and quiz locally.
              </p>
              <form className="mt-4 space-y-3" onSubmit={handleRegister}>
                <input
                  name="name"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                  placeholder="Full name"
                  required
                />
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                  placeholder="you@university.edu"
                  required
                />
                <input
                  name="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                  placeholder="Create a password"
                  required
                />
                <button
                  className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-5 py-2 text-sm font-semibold text-slate-900"
                  type="submit"
                >
                  Create account
                </button>
                {registerStatus && (
                  <p className="text-xs text-slate-500">{registerStatus}</p>
                )}
              </form>
            </div>
            <div className="glass-card p-6">
              <h4 className="text-lg font-semibold text-slate-800">Login</h4>
              <p className="mt-2 text-sm text-slate-500">
                Already registered? Sign in to continue.
              </p>
              <form className="mt-4 space-y-3" onSubmit={handleLogin}>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                  placeholder="you@university.edu"
                  required
                />
                <input
                  name="password"
                  type="password"
                  className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                  placeholder="Enter your password"
                  required
                />
                <button
                  className="rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-700"
                  type="submit"
                >
                  Login
                </button>
                {loginStatus && (
                  <p className="text-xs text-slate-500">{loginStatus}</p>
                )}
              </form>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}

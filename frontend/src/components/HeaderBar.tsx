import { useNavigate } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa6";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";
import { apiFetch } from "../lib/api";

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  compact?: boolean;
  onAccountClick?: () => void;
}

export default function HeaderBar({
  title,
  subtitle,
  compact,
  onAccountClick,
}: HeaderBarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleAccount = () => {
    if (onAccountClick) {
      onAccountClick();
    } else {
      navigate("/?auth=1");
    }
  };

  const handleThemeToggle = async () => {
    toggleTheme();
    if (!user) return;
    const next = theme === "dark" ? "light" : "dark";
    try {
      await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { theme: next } }),
      });
    } catch (_error) {
      // Non-blocking: theme still toggles locally.
    }
  };

  return (
    <header
      className={`sticky top-0 z-20 border-b border-white/40 bg-gradient-to-r from-sky-500/20 to-amber-400/20 backdrop-blur ${
        compact ? "py-4" : "py-6"
      } px-6 lg:px-10`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={`heading-font ${compact ? "text-2xl" : "text-3xl"}`}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-500 max-w-2xl">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-600"
            onClick={handleThemeToggle}
            type="button"
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>
          {!user && (
            <button
              className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={handleAccount}
              type="button"
            >
              Login / Register
            </button>
          )}
          <div className="rounded-full border border-slate-200/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700">
            {user ? `Hi, ${user.name || user.email}` : "Guest"}
          </div>
          {user && (
            <button
              className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

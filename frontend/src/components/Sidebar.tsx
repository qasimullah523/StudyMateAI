import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";
import { FaBolt } from "react-icons/fa6";

interface SidebarProps {
  onAccountClick?: () => void;
}

export default function Sidebar({ onAccountClick }: SidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAccount = () => {
    if (onAccountClick) {
      onAccountClick();
    } else {
      navigate("/?auth=1");
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "rounded-xl px-4 py-2 text-sm font-semibold transition",
      isActive
        ? "bg-sky-200/40 text-slate-900 shadow-sm"
        : "text-slate-500 hover:bg-sky-200/20 hover:text-slate-900",
    ].join(" ");

  return (
    <aside className="w-full border-b border-white/40 bg-white/80 px-6 py-6 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:border-b-0 lg:border-r">
      <div className="text-2xl font-bold text-slate-900 heading-font">
        StudyMate AI
      </div>
      <div className="mt-2 text-sm text-slate-500">
        AI study toolkit for students.
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 lg:flex-col">
        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/upload" className={linkClass}>
          Upload
        </NavLink>
        <NavLink to="/quiz" className={linkClass}>
          Quiz
        </NavLink>
        <NavLink to="/planner" className={linkClass}>
          Planner
        </NavLink>
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>
      </nav>

      <div className="mt-8 glass-card px-4 py-4">
        <div className="text-sm font-semibold text-slate-700">Quick start</div>
        <p className="mt-2 text-sm text-slate-500">
          Upload notes and get results in minutes.
        </p>
        <button
          className="mt-3 w-full rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/20"
          onClick={() => navigate("/upload")}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <FaBolt /> Start now
          </span>
        </button>
        {!user && (
          <button
            className="mt-2 w-full rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={handleAccount}
            type="button"
          >
            Register / Login
          </button>
        )}
      </div>
    </aside>
  );
}

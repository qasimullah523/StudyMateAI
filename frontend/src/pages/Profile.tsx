import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";
import { apiFetch } from "../lib/api";
import { useAuth } from "../state/AuthContext";
import { useTheme } from "../state/ThemeContext";

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { setTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [theme, setThemeValue] = useState("light");
  const [profileStatus, setProfileStatus] = useState("");
  const [preferencesStatus, setPreferencesStatus] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setThemeValue(user.preferences?.theme || "light");
    }
  }, [user]);

  const handleProfileUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!user) return;

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Update failed");
      }

      await refreshProfile();
      setPassword("");
      setProfileStatus("Profile updated.");
    } catch (error) {
      setProfileStatus((error as Error).message || "Update failed");
    }
  };

  const handlePreferences = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      const response = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: { theme } }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Update failed");
      }
      setTheme(theme === "dark" ? "dark" : "light");
      await refreshProfile();
      setPreferencesStatus("Preferences saved.");
    } catch (error) {
      setPreferencesStatus((error as Error).message || "Update failed");
    }
  };

  return (
    <PageShell
      title="Profile"
      subtitle="Update your account details and preferences."
    >
      {!user && (
        <div className="glass-card p-6 text-sm text-slate-500">
          Sign in to edit your profile.
        </div>
      )}

      {user && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card p-6">
            <h3 className="heading-font text-lg">Profile details</h3>
            <p className="mt-2 text-sm text-slate-500">
              Keep your info up to date.
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleProfileUpdate}>
              <input
                className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                placeholder="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                placeholder="you@university.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                placeholder="Leave blank to keep current"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-5 py-2 text-sm font-semibold text-slate-900"
                type="submit"
              >
                Save changes
              </button>
              {profileStatus && (
                <p className="text-xs text-slate-500">{profileStatus}</p>
              )}
            </form>
          </div>

          <div className="glass-card p-6">
            <h3 className="heading-font text-lg">Preferences</h3>
            <p className="mt-2 text-sm text-slate-500">
              Customize your StudyMate experience.
            </p>
            <form className="mt-4 space-y-3" onSubmit={handlePreferences}>
              <select
                className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm"
                value={theme}
                onChange={(event) => setThemeValue(event.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <button
                className="rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-700"
                type="submit"
              >
                Update preferences
              </button>
              {preferencesStatus && (
                <p className="text-xs text-slate-500">{preferencesStatus}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}

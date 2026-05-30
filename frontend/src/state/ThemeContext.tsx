import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStoredUser,
  getThemeStorage,
  setThemeStorage,
} from "../lib/storage";
import type { UserProfile } from "../lib/types";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialTheme(): ThemeMode {
  const stored = getThemeStorage();
  if (stored === "light" || stored === "dark") return stored;
  const user = getStoredUser<UserProfile>();
  if (user?.preferences?.theme) return user.preferences.theme;
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    resolveInitialTheme(),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    setThemeStorage(theme);
  }, [theme]);

  useEffect(() => {
    const handler = () => {
      const stored = getThemeStorage();
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const toggleTheme = () =>
    setThemeState((current) => (current === "dark" ? "light" : "dark"));

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

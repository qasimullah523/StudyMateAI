import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "../lib/api";
import {
  clearAuthSession,
  getStoredUser,
  getToken,
  setAuthSession,
} from "../lib/storage";
import type { UserProfile } from "../lib/types";

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; user?: UserProfile }>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; user?: UserProfile }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() =>
    getStoredUser<UserProfile>(),
  );
  const [token, setToken] = useState<string | null>(() => getToken());
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiFetch("/api/auth/me");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Session expired");
      }
      setAuthSession(currentToken, data.user);
      setUser(data.user);
      setToken(currentToken);
    } catch (_error) {
      clearAuthSession();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || "Login failed" };
      }
      setAuthSession(data.token, data.user);
      setUser(data.user);
      setToken(data.token);
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, error: (error as Error).message || "Login failed" };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || "Registration failed" };
      }
      setAuthSession(data.token, data.user);
      setUser(data.user);
      setToken(data.token);
      return { ok: true, user: data.user };
    } catch (error) {
      return {
        ok: false,
        error: (error as Error).message || "Registration failed",
      };
    }
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshProfile }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

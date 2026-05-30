import { getToken } from "./storage";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

export function apiUrl(path: string) {
  if (path.startsWith("http")) {
    return path;
  }
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleaned}`;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return fetch(apiUrl(path), { ...options, headers });
}

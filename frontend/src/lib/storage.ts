const AUTH_TOKEN_KEY = "studymate:token";
const AUTH_PROFILE_KEY = "studymate:profile";
const THEME_KEY = "studymate:theme";
const COOKIE_KEY = "studymate:cookies";
const HISTORY_KEY = "studymate:history";
const LAST_KEY = "studymate:last";

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser<T>() {
  try {
    const raw = localStorage.getItem(AUTH_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (_error) {
    return null;
  }
}

export function setAuthSession(token: string, user: unknown) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PROFILE_KEY);
}

export function setThemeStorage(theme: string) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getThemeStorage() {
  return localStorage.getItem(THEME_KEY);
}

export function getCookieChoice() {
  return localStorage.getItem(COOKIE_KEY);
}

export function setCookieChoice(value: string) {
  localStorage.setItem(COOKIE_KEY, value);
}

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
}

export function saveHistory(entry: unknown) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 8)));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function saveLast(payload: unknown) {
  localStorage.setItem(LAST_KEY, JSON.stringify(payload));
}

export function getLast<T>() {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (_error) {
    return null;
  }
}

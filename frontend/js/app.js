const API_BASE = document.body.dataset.apiBase || "http://localhost:5000";
const AUTH_TOKEN_KEY = "studymate:token";
const AUTH_PROFILE_KEY = "studymate:profile";
const THEME_KEY = "studymate:theme";
const COOKIE_KEY = "studymate:cookies";
const HISTORY_KEY = "studymate:history";

const DEMO_SUMMARY = {
  shortSummary:
    "Data structures organize information so algorithms can access, update, and scale efficiently.",
  keyPoints: [
    "Arrays enable fast indexing but fixed size.",
    "Linked lists are flexible but slower for random access.",
    "Stacks and queues control order of processing.",
    "Trees model hierarchies and speed up search.",
    "Big-O estimates performance for operations."
  ],
  keyConcepts: [
    "Complexity analysis",
    "Stack (LIFO)",
    "Queue (FIFO)",
    "Binary search tree",
    "Hash tables"
  ],
  formulas: [
    "Access time (array): O(1)",
    "Search (BST avg): O(log n)",
    "Search (linear): O(n)"
  ]
};

const DEMO_QUIZ = {
  questions: [
    {
      question: "Which data structure uses LIFO order?",
      options: ["Queue", "Stack", "Array", "Tree"],
      answer: "Stack"
    },
    {
      question: "Average search time in a balanced BST is:",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      answer: "O(log n)"
    },
    {
      question: "Which structure is best for FIFO processing?",
      options: ["Queue", "Stack", "Heap", "Graph"],
      answer: "Queue"
    }
  ]
};

const select = (selector) => document.querySelector(selector);
const selectAll = (selector) => Array.from(document.querySelectorAll(selector));

function toggleHidden(element, hide) {
  if (!element) return;
  element.classList.toggle("hidden", hide);
}

function setText(element, text) {
  if (element) element.textContent = text;
}

function escapeHtml(value) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return String(value || "").replace(/[&<>"']/g, (char) => map[char]);
}

function renderMarkdown(text) {
  const raw = String(text || "");
  if (!window.marked) {
    return escapeHtml(raw).replace(/\n/g, "<br>");
  }

  const renderer = new window.marked.Renderer();
  renderer.html = (html) => escapeHtml(html);
  renderer.link = (href, title, text) => {
    const url = typeof href === "string" ? href.trim() : "";
    const isSafe = /^(https?:|mailto:|tel:)/i.test(url);
    if (!isSafe) {
      return text;
    }
    const safeTitle = title ? ` title="${escapeHtml(title)}"` : "";
    return `<a href="${escapeHtml(url)}"${safeTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  const html = window.marked.parse(raw, { breaks: true, gfm: true, renderer });
  if (window.DOMPurify) {
    return window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }
  return html;
}

function shortenText(text, maxSentences = 3, maxChars = 420) {
  const clean = String(text || "").trim();
  if (!clean) return "";
  const parts = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  let result = parts.slice(0, maxSentences).join(" ").trim();
  if (result.length > maxChars) {
    result = `${result.slice(0, maxChars).trim()}...`;
  } else if (parts.length > maxSentences) {
    result = `${result} ...`;
  }
  return result;
}

function appendChatMessage(type, text) {
  const feed = select("#chatFeed");
  if (!feed || !text) return;
  const message = document.createElement("div");
  const role = type || "ai";
  const label = role === "user" ? "You" : role === "system" ? "System" : "StudyMate";
  const safe = renderMarkdown(text);
  message.className = `chat-message ${role}`;
  message.innerHTML = `
    <div class="chat-message-header">${label}</div>
    <div class="chat-message-body">${safe}</div>
  `;
  feed.appendChild(message);
  feed.scrollTop = feed.scrollHeight;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function renderResultList(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!items || !items.length) {
    listEl.innerHTML = "<li class=\"text-muted\">No results</li>";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "result-item";
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(item.fileName || "Note")}</strong>
        <div class=\"text-muted\">${formatDate(item.uploadedAt || item.createdAt)}</div>
      </div>
      <span class=\"text-muted\">${escapeHtml(
        shortenText(item.summary?.shortSummary || "", 1, 120)
      )}</span>
    `;
    listEl.appendChild(li);
  });
}

function renderList(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!items || !items.length) {
    listEl.innerHTML = "<li class=\"text-muted\">No items yet</li>";
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    listEl.appendChild(li);
  });
}

function renderSummary(summary) {
  if (!summary) return;
  setText(select("#summaryShort"), shortenText(summary.shortSummary || "", 3, 420));
  renderList(select("#summaryKeyPoints"), summary.keyPoints || []);
  renderList(select("#summaryKeyConcepts"), summary.keyConcepts || []);
  renderList(select("#summaryFormulas"), summary.formulas || []);
}

function renderQuiz(container, quiz) {
  if (!container) return;
  container.innerHTML = "";
  const questions = (quiz && quiz.questions) || [];
  if (!questions.length) {
    container.innerHTML = "<p class=\"text-muted\">No questions yet</p>";
    return;
  }

  questions.forEach((question, index) => {
    const card = document.createElement("div");
    card.className = "glass-card quiz-card fade-up";
    const options = (question.options || []).map((option) => {
      return `<li class=\"option-item\">${escapeHtml(option)}</li>`;
    });

    card.innerHTML = `
      <div class=\"d-flex justify-content-between align-items-center mb-2\">
        <span class=\"badge text-bg-info\">Q${index + 1}</span>
        <button class=\"btn btn-sm btn-outline-light reveal-btn\" type=\"button\">Reveal</button>
      </div>
      <h6>${escapeHtml(question.question || "")}</h6>
      <ul class=\"list-unstyled mt-3 mb-3\">
        ${options.join("")}
      </ul>
      <div class=\"answer hidden\">Answer: <span>${escapeHtml(question.answer || "")}</span></div>
    `;

    const button = card.querySelector(".reveal-btn");
    const answer = card.querySelector(".answer");
    button.addEventListener("click", () => {
      answer.classList.toggle("hidden");
    });

    container.appendChild(card);
  });
}

function renderFlashcards(container, quiz) {
  if (!container) return;
  container.innerHTML = "";
  const questions = (quiz && quiz.questions) || [];
  if (!questions.length) {
    container.innerHTML = "<p class=\"text-muted\">No flashcards yet</p>";
    return;
  }

  questions.forEach((question) => {
    const card = document.createElement("div");
    card.className = "flashcard";
    card.innerHTML = `
      <div class=\"flashcard-inner\">
        <div class=\"flashcard-face\">
          <strong>Question</strong>
          <div>${escapeHtml(question.question || "")}</div>
        </div>
        <div class=\"flashcard-face flashcard-back\">
          <strong>Answer</strong>
          <div>${escapeHtml(question.answer || "")}</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
    });

    container.appendChild(card);
  });
}

function saveLastResult(payload) {
  try {
    localStorage.setItem("studymate:last", JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not save to localStorage", error);
  }
}

function getLocalHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveLocalHistory(entry) {
  const history = getLocalHistory();
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 8)));
}

function renderHistory(listEl, items, statusEl) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!items || !items.length) {
    listEl.innerHTML = "<li class=\"text-muted\">No saved sessions yet</li>";
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";
    const date = item.createdAt ? new Date(item.createdAt) : new Date();
    li.innerHTML = `
      <div class=\"history-meta\">
        <strong>${escapeHtml(item.fileName || "Session")}</strong>
        <small>${date.toLocaleString()}</small>
      </div>
      <button class=\"btn btn-sm btn-outline-secondary\" type=\"button\">Load</button>
    `;

    const button = li.querySelector("button");
    button.addEventListener("click", () => {
      renderSummary(item.summary);
      renderQuiz(select("#quizContainer"), item.quiz);
      renderFlashcards(select("#flashcardContainer"), item.quiz);
      setText(statusEl, "Loaded from history.");
    });

    listEl.appendChild(li);
  });
}

async function fetchHistory(listEl, statusEl) {
  if (!listEl) return;
  if (!getToken()) {
    renderHistory(listEl, getLocalHistory(), statusEl);
    return;
  }

  try {
    const response = await apiFetch(`${API_BASE}/api/notes?limit=8`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Could not load history");
    }
    renderHistory(listEl, data.items || [], statusEl);
  } catch (error) {
    renderHistory(listEl, getLocalHistory(), statusEl);
    setText(statusEl, error.message || "Could not load history");
  }
}

function collectSummaryContext() {
  const shortSummary = select("#summaryShort")?.textContent || "";
  const points = Array.from(selectAll("#summaryKeyPoints li")).map((li) => li.textContent);
  const concepts = Array.from(selectAll("#summaryKeyConcepts li")).map((li) => li.textContent);
  const formulas = Array.from(selectAll("#summaryFormulas li")).map((li) => li.textContent);

  return [
    shortSummary ? `Summary: ${shortSummary}` : "",
    points.length ? `Key points: ${points.join("; ")}` : "",
    concepts.length ? `Key concepts: ${concepts.join("; ")}` : "",
    formulas.length ? `Formulas: ${formulas.join("; ")}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

async function askAi(question, spinner, statusEl) {
  toggleHidden(spinner, false);
  setText(statusEl, "Thinking...");

  try {
    const context = collectSummaryContext();
    const payload = {
      text: [context ? `Context:\n${context}` : "", `Question: ${question}`]
        .filter(Boolean)
        .join("\n\n")
    };

    const response = await apiFetch(`${API_BASE}/api/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "AI request failed");
    }

    const answer = (data.explanation || "").trim();
    appendChatMessage("ai", answer || "No response yet.");
    setText(statusEl, "Answer ready.");
  } catch (error) {
    console.error(error);
    appendChatMessage("system", error.message || "AI request failed");
    setText(statusEl, error.message || "AI request failed");
  } finally {
    toggleHidden(spinner, true);
  }
}

function loadLastResult() {
  try {
    const raw = localStorage.getItem("studymate:last");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function readJsonValue(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getStoredUser() {
  return readJsonValue(AUTH_PROFILE_KEY);
}

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PROFILE_KEY);
}

function getActiveUser() {
  const user = getStoredUser();
  const token = getToken();
  if (!user || !token) return null;
  return user;
}

async function apiFetch(url, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

async function fetchProfile() {
  const token = getToken();
  if (!token) return null;
  try {
    const response = await apiFetch(`${API_BASE}/api/auth/me`);
    const data = await response.json();
    if (!response.ok) {
      clearAuthSession();
      return null;
    }
    setAuthSession(token, data.user);
    if (data.user && data.user.preferences && data.user.preferences.theme) {
      applyTheme(data.user.preferences.theme);
    }
    return data.user;
  } catch (error) {
    clearAuthSession();
    return null;
  }
}

function applyTheme(theme) {
  const mode = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme-dark", mode === "dark");
  const toggle = select("#themeToggle");
  if (toggle) {
    toggle.innerHTML = mode === "dark" ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }
}

async function saveThemePreference(theme) {
  localStorage.setItem(THEME_KEY, theme);
  if (!getToken()) return;
  try {
    await apiFetch(`${API_BASE}/api/auth/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: { theme } })
    });
  } catch (error) {
    console.warn("Could not save theme preference", error);
  }
}

function initThemeToggle() {
  const toggle = select("#themeToggle");
  const saved = localStorage.getItem(THEME_KEY);
  const profileTheme = getStoredUser()?.preferences?.theme;
  applyTheme(saved || profileTheme || "light");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      saveThemePreference(next);
    });
  }
}

function updateAuthDisplay() {
  const badge = select("#userBadge");
  const logoutBtn = select("#logoutBtn");
  const accountToggle = select("#accountToggle");
  const authSection = select("#authSection");
  const sidebarAccountToggle = select("#sidebarAccountToggle");
  if (!badge) return;

  const user = getActiveUser();
  if (user) {
    setText(badge, `Hi, ${user.name || user.email}`);
    badge.classList.add("is-auth");
    toggleHidden(logoutBtn, false);
    if (accountToggle) accountToggle.classList.add("hidden");
    if (sidebarAccountToggle) sidebarAccountToggle.classList.add("hidden");
    if (authSection) authSection.classList.add("hidden");
  } else {
    setText(badge, "Sign in required");
    badge.classList.remove("is-auth");
    toggleHidden(logoutBtn, true);
    if (accountToggle) accountToggle.classList.remove("hidden");
    if (sidebarAccountToggle) sidebarAccountToggle.classList.remove("hidden");
  }
}

function initAuthUI() {
  const registerForm = select("#registerForm");
  const loginForm = select("#loginForm");
  const registerStatus = select("#registerStatus");
  const loginStatus = select("#loginStatus");
  const logoutBtn = select("#logoutBtn");
  const accountToggle = select("#accountToggle");
  const authSection = select("#authSection");
  const sidebarAccountToggle = select("#sidebarAccountToggle");

  updateAuthDisplay();
  fetchProfile().then(updateAuthDisplay);

  if (accountToggle) {
    if (authSection) {
      accountToggle.addEventListener("click", () => {
        authSection.classList.toggle("hidden");
      });
    } else {
      accountToggle.addEventListener("click", () => {
        window.location.href = "index.html#auth";
      });
    }
  }

  if (sidebarAccountToggle) {
    if (authSection) {
      sidebarAccountToggle.addEventListener("click", () => {
        authSection.classList.toggle("hidden");
      });
    } else {
      sidebarAccountToggle.addEventListener("click", () => {
        window.location.href = "index.html#auth";
      });
    }
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = select("#registerName").value.trim();
      const email = select("#registerEmail").value.trim();
      const password = select("#registerPassword").value.trim();

      if (!name || !email || !password) {
        setText(registerStatus, "Please fill in all fields.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Registration failed");
        }
        setAuthSession(data.token, data.user);
        setText(registerStatus, "Account created. You are signed in.");
        setText(loginStatus, "");
        registerForm.reset();
        updateAuthDisplay();
      } catch (error) {
        setText(registerStatus, error.message || "Registration failed");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = select("#loginEmail").value.trim();
      const password = select("#loginPassword").value.trim();

      if (!email || !password) {
        setText(loginStatus, "Enter your email and password.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }
        setAuthSession(data.token, data.user);
        setText(loginStatus, "Logged in successfully.");
        setText(registerStatus, "");
        loginForm.reset();
        updateAuthDisplay();
      } catch (error) {
        setText(loginStatus, error.message || "Login failed");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearAuthSession();
      setText(loginStatus, "Signed out.");
      updateAuthDisplay();
    });
  }

  if (authSection && window.location.hash === "#auth") {
    authSection.classList.remove("hidden");
  }
}

function initCookieBanner() {
  const banner = select("#cookieBanner");
  const acceptBtn = select("#cookieAccept");
  const rejectBtn = select("#cookieReject");
  if (!banner) return;

  const choice = localStorage.getItem(COOKIE_KEY);
  if (choice) {
    banner.classList.add("hidden");
    return;
  }

  banner.classList.remove("hidden");

  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      localStorage.setItem(COOKIE_KEY, "accepted");
      banner.classList.add("hidden");
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", () => {
      localStorage.setItem(COOKIE_KEY, "rejected");
      banner.classList.add("hidden");
    });
  }
}

async function uploadPdf(file, spinner, statusEl) {
  toggleHidden(spinner, false);
  setText(statusEl, "Uploading and analyzing...");
  appendChatMessage("system", `Uploading ${file.name}...`);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    renderSummary(data.summary);
    renderQuiz(select("#quizContainer"), data.quiz);
    renderFlashcards(select("#flashcardContainer"), data.quiz);
    const payload = {
      fileName: data.fileName || file.name,
      summary: data.summary,
      quiz: data.quiz,
      createdAt: new Date().toISOString()
    };
    saveLastResult(payload);
    if (getToken()) {
      fetchHistory(select("#historyList"), statusEl);
    } else {
      saveLocalHistory(payload);
      renderHistory(select("#historyList"), getLocalHistory(), statusEl);
    }
    if (!data.saved && !getToken()) {
      setText(statusEl, "Summary ready. Sign in to save history.");
    } else {
      setText(statusEl, "Done. Summary and quiz ready.");
    }
    appendChatMessage("system", `Summary and quiz ready for ${payload.fileName}.`);
  } catch (error) {
    console.error(error);
    appendChatMessage("system", error.message || "Upload failed");
    setText(statusEl, error.message || "Upload failed");
  } finally {
    toggleHidden(spinner, true);
  }
}

function initUploadPage() {
  const chatShell = select("#chatShell");
  const uploadPdfBtn = select("#uploadPdfBtn");
  const uploadImageBtn = select("#uploadImageBtn");
  const fileInput = select("#fileInput");
  const askImage = select("#askImage");
  const uploadBtn = select("#uploadBtn");
  const demoBtn = select("#demoBtn");
  const fileName = select("#fileName");
  const spinner = select("#uploadSpinner");
  const statusEl = select("#uploadStatus");
  const historyList = select("#historyList");
  const clearHistoryBtn = select("#clearHistoryBtn");
  const askBtn = select("#askBtn");
  const askClearBtn = select("#askClearBtn");
  const askQuestion = select("#askQuestion");
  const askStatus = select("#askStatus");
  const askSpinner = select("#askSpinner");
  if (!fileInput || !uploadBtn) return;

  if (uploadPdfBtn) {
    uploadPdfBtn.addEventListener("click", () => fileInput.click());
  }

  if (uploadImageBtn && askImage) {
    uploadImageBtn.addEventListener("click", () => askImage.click());
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      setText(fileName, file.name);
      fileName.classList.remove("hidden");
      setText(statusEl, "PDF selected. Click Analyze.");
    } else {
      setText(fileName, "");
      fileName.classList.add("hidden");
    }
  });

  if (chatShell) {
    chatShell.addEventListener("dragover", (event) => {
      event.preventDefault();
      chatShell.classList.add("dragover");
    });

    chatShell.addEventListener("dragleave", () => {
      chatShell.classList.remove("dragover");
    });

    chatShell.addEventListener("drop", (event) => {
      event.preventDefault();
      chatShell.classList.remove("dragover");
      const file = event.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        fileInput.files = event.dataTransfer.files;
        setText(fileName, file.name);
        fileName.classList.remove("hidden");
        setText(statusEl, "PDF selected. Click Analyze.");
      }
    });
  }

  uploadBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      setText(statusEl, "Please choose a PDF first.");
      return;
    }
    uploadPdf(file, spinner, statusEl);
  });

  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      renderSummary(DEMO_SUMMARY);
      renderQuiz(select("#quizContainer"), DEMO_QUIZ);
      renderFlashcards(select("#flashcardContainer"), DEMO_QUIZ);
      const payload = {
        fileName: "Demo Notes",
        summary: DEMO_SUMMARY,
        quiz: DEMO_QUIZ,
        createdAt: new Date().toISOString()
      };
      saveLastResult(payload);
      if (getToken()) {
        fetchHistory(historyList, statusEl);
      } else {
        saveLocalHistory(payload);
        renderHistory(historyList, getLocalHistory(), statusEl);
      }
      setText(statusEl, "Demo loaded. Ready to present.");
      appendChatMessage("system", "Demo notes loaded.");
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", async () => {
      if (getToken()) {
        try {
          const response = await apiFetch(`${API_BASE}/api/notes`, { method: "DELETE" });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Could not clear history");
          }
          fetchHistory(historyList, statusEl);
          setText(statusEl, "History cleared.");
          return;
        } catch (error) {
          setText(statusEl, error.message || "Could not clear history");
        }
      }
      localStorage.removeItem(HISTORY_KEY);
      renderHistory(historyList, getLocalHistory(), statusEl);
      setText(statusEl, "History cleared.");
    });
  }

  if (askBtn && askQuestion) {
    askBtn.addEventListener("click", () => {
      const question = askQuestion.value.trim();
      if (!question) {
        setText(askStatus, "Type a question first.");
        return;
      }
      appendChatMessage("user", question);
      askAi(question, askSpinner, askStatus);
    });
  }

  if (askClearBtn && askQuestion) {
    askClearBtn.addEventListener("click", () => {
      askQuestion.value = "";
      setText(askStatus, "");
    });
  }

  if (askImage) {
    askImage.addEventListener("change", () => {
      if (askImage.files && askImage.files[0]) {
        setText(askStatus, "Image attached (beta). Ask a question to proceed.");
        appendChatMessage("system", "Image attached (beta). Ask a question to proceed.");
      }
    });
  }

  fetchHistory(historyList, statusEl);
}

async function generateQuizFromText(text, spinner, statusEl, container) {
  toggleHidden(spinner, false);
  setText(statusEl, "Generating quiz...");

  try {
    const response = await apiFetch(`${API_BASE}/api/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Quiz generation failed");
    }

    renderQuiz(container, data);
    saveLastResult({ quiz: data });
    setText(statusEl, "Quiz ready.");
  } catch (error) {
    console.error(error);
    setText(statusEl, error.message || "Quiz generation failed");
  } finally {
    toggleHidden(spinner, true);
  }
}

function initQuizPage() {
  const quizText = select("#quizText");
  const generateBtn = select("#generateQuizBtn");
  const loadLastBtn = select("#loadLastQuizBtn");
  const spinner = select("#quizSpinner");
  const statusEl = select("#quizStatus");
  const container = select("#quizResult");

  if (!generateBtn || !quizText) return;

  generateBtn.addEventListener("click", () => {
    const text = quizText.value.trim();
    if (!text) {
      setText(statusEl, "Paste notes first.");
      return;
    }
    generateQuizFromText(text, spinner, statusEl, container);
  });

  if (loadLastBtn) {
    loadLastBtn.addEventListener("click", () => {
      const last = loadLastResult();
      if (last && last.quiz) {
        renderQuiz(container, last.quiz);
        setText(statusEl, "Loaded last quiz.");
      } else {
        setText(statusEl, "No saved quiz yet.");
      }
    });
  }
}

function parseSubjectsInput(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const match = token.match(/^(.*?)(?:\((easy|medium|hard)\)|:(easy|medium|hard))$/i);
      if (match) {
        return {
          name: match[1].trim(),
          difficulty: (match[2] || match[3]).toLowerCase()
        };
      }
      return { name: token, difficulty: "medium" };
    });
}

function renderPlan(container, plan) {
  if (!container) return;
  container.innerHTML = "";
  if (!plan || !plan.schedule) {
    container.innerHTML = "<p class=\"text-muted\">No plan generated</p>";
    return;
  }

  plan.schedule.forEach((day) => {
    const card = document.createElement("div");
    card.className = "glass-card plan-card fade-up";
    const sessions = (day.sessions || [])
      .map((session) => `<li>${escapeHtml(session.subject)} - ${session.hours}h</li>`)
      .join("");

    card.innerHTML = `
      <h6>${escapeHtml(day.label)} <span class=\"text-muted\">${escapeHtml(day.date)}</span></h6>
      <ul class=\"mt-3\">${sessions}</ul>
    `;
    container.appendChild(card);
  });
}

async function generatePlanner(payload, spinner, statusEl, container) {
  toggleHidden(spinner, false);
  setText(statusEl, "Building plan...");

  try {
    const response = await apiFetch(`${API_BASE}/api/planner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Planner failed");
    }

    renderPlan(container, data);
    setText(statusEl, "Plan ready.");
  } catch (error) {
    console.error(error);
    setText(statusEl, error.message || "Planner failed");
  } finally {
    toggleHidden(spinner, true);
  }
}

function initPlannerPage() {
  const form = select("#plannerForm");
  const subjectsInput = select("#subjectsInput");
  const examDateInput = select("#examDateInput");
  const hoursInput = select("#hoursInput");
  const difficultyInput = select("#difficultyInput");
  const spinner = select("#plannerSpinner");
  const statusEl = select("#plannerStatus");
  const output = select("#plannerOutput");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rawSubjects = subjectsInput.value;
    const subjects = parseSubjectsInput(rawSubjects);
    if (!subjects.length) {
      setText(statusEl, "Add at least one subject.");
      return;
    }

    const payload = {
      subjects,
      examDate: examDateInput.value || null,
      hoursPerDay: hoursInput.value || 3,
      overallDifficulty: difficultyInput.value || "medium"
    };

    generatePlanner(payload, spinner, statusEl, output);
  });
}

async function initDashboardPage() {
  const statsTotalNotes = select("#statsTotalNotes");
  const statsTotalQuestions = select("#statsTotalQuestions");
  const statsTotalFlashcards = select("#statsTotalFlashcards");
  const statsLastUpload = select("#statsLastUpload");
  const searchInput = select("#noteSearchInput");
  const searchBtn = select("#noteSearchBtn");
  const searchResults = select("#searchResults");
  const recentNotesList = select("#recentNotesList");

  if (!statsTotalNotes) return;

  if (!getToken()) {
    setText(statsTotalNotes, "-");
    setText(statsTotalQuestions, "-");
    setText(statsTotalFlashcards, "-");
    setText(statsLastUpload, "Sign in required");
    renderResultList(searchResults, []);
    renderResultList(recentNotesList, []);
    return;
  }

  try {
    const response = await apiFetch(`${API_BASE}/api/notes/stats`);
    const data = await response.json();
    if (response.ok) {
      setText(statsTotalNotes, data.totalNotes || 0);
      setText(statsTotalQuestions, data.totalQuizQuestions || 0);
      setText(statsTotalFlashcards, data.totalFlashcards || 0);
      setText(statsLastUpload, data.lastUpload ? formatDate(data.lastUpload) : "-");
    }
  } catch (error) {
    console.error(error);
  }

  try {
    const response = await apiFetch(`${API_BASE}/api/notes?limit=6`);
    const data = await response.json();
    if (response.ok) {
      renderResultList(recentNotesList, data.items || []);
    }
  } catch (error) {
    console.error(error);
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", async () => {
      const query = searchInput.value.trim();
      if (!query) {
        renderResultList(searchResults, []);
        return;
      }
      try {
        const response = await apiFetch(
          `${API_BASE}/api/notes/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Search failed");
        }
        renderResultList(searchResults, data.items || []);
      } catch (error) {
        renderResultList(searchResults, []);
      }
    });
  }
}

async function initProfilePage() {
  const profileForm = select("#profileForm");
  const preferencesForm = select("#preferencesForm");
  const profileName = select("#profileName");
  const profileEmail = select("#profileEmail");
  const profilePassword = select("#profilePassword");
  const profileTheme = select("#profileTheme");
  const profileStatus = select("#profileStatus");
  const preferencesStatus = select("#preferencesStatus");

  if (!profileForm && !preferencesForm) return;

  if (!getToken()) {
    setText(profileStatus, "Sign in to edit your profile.");
    return;
  }

  try {
    const response = await apiFetch(`${API_BASE}/api/auth/me`);
    const data = await response.json();
    if (response.ok) {
      const user = data.user || {};
      if (profileName) profileName.value = user.name || "";
      if (profileEmail) profileEmail.value = user.email || "";
      if (profileTheme) profileTheme.value = user.preferences?.theme || "light";
    }
  } catch (error) {
    console.error(error);
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = {
        name: profileName?.value.trim(),
        email: profileEmail?.value.trim()
      };
      if (profilePassword && profilePassword.value.trim()) {
        payload.password = profilePassword.value.trim();
      }

      try {
        const response = await apiFetch(`${API_BASE}/api/auth/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Update failed");
        }
        setAuthSession(getToken(), data.user);
        setText(profileStatus, "Profile updated.");
        profilePassword.value = "";
        updateAuthDisplay();
      } catch (error) {
        setText(profileStatus, error.message || "Update failed");
      }
    });
  }

  if (preferencesForm && profileTheme) {
    preferencesForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const theme = profileTheme.value;
      applyTheme(theme);
      await saveThemePreference(theme);
      setText(preferencesStatus, "Preferences saved.");
    });
  }
}

initAuthUI();
initThemeToggle();
initCookieBanner();
initUploadPage();
initQuizPage();
initPlannerPage();
initDashboardPage();
initProfilePage();

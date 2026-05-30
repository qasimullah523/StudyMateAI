# StudyMateAI

StudyMateAI is an AI-powered study companion for university students. It lets users upload lecture PDFs and generate summaries, quizzes, flashcards, explanations, and study plans.

## Features

- User authentication (register, login, profile)
- PDF upload and text extraction
- AI-generated:
  - Short summaries and key points
  - Quiz questions
  - Flashcards
  - Topic explanations
  - Personalized study plans
- Notes history, search, and dashboard statistics
- Theme preference support

## Tech Stack

- **Frontend:** HTML, CSS, Bootstrap, vanilla JavaScript
- **Backend:** Node.js, Express
- **Database:** MongoDB (via Mongoose)
- **AI:** Google Gemini API
- **Auth:** JWT + bcrypt

## Project Structure

```text
StudyMateAI/
├── backend/            # Express API, auth, AI, planner, notes
├── frontend/           # Static HTML/CSS/JS pages
├── docs/               # Architecture and API docs
├── package.json        # Root dependencies
└── README.md
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string (optional for full persistence, but recommended)
- Gemini API key

## Setup and Run

### 1) Install dependencies

```bash
# Root (shared deps)
cd StudyMateAI
npm install

# Backend
cd backend
npm install
```

### 2) Configure environment

Create a `.env` file in `backend/` using `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_FALLBACK_MODELS=gemini-1.5-flash,gemini-2.0-flash
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=7d
```

### 3) Start the backend server

```bash
cd backend
npm run dev
```

### 4) Open the app

Open: `http://localhost:5000`

The backend serves the `frontend/` directory as static files.

## API Overview

Base route: `http://localhost:5000/api`

Main endpoint groups:

- `/auth` — registration, login, profile
- `/upload` — PDF upload and processing
- `/summary`, `/quiz`, `/explain` — AI study endpoints
- `/planner` — study plan generation
- `/notes` — notes history, search, and stats

For detailed request/response examples, see [docs/API.md](docs/API.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Project Docs Overview](docs/README.md)

## Available Scripts

In `backend/package.json`:

- `npm start` — run server with Node
- `npm run dev` — run server with Nodemon

## Notes

- If `MONGODB_URI` is not set, the app will still start, but database-backed features may be limited.
- Ensure `GEMINI_API_KEY` is set to use AI generation features.

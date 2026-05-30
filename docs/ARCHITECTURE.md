# StudyMate AI Architecture

```mermaid
flowchart LR
  A[Frontend
React + Vite + Tailwind]
  B[Backend
Node.js + Express + TypeScript]
  C[Gemini API]
  D[MongoDB Atlas]
  E[PDF Upload + Parsing]

  A -->|HTTP| B
  B --> E
  E --> B
  B --> C
  C --> B
  B --> D
  D --> B
  B --> A
```

**Flow**

1. User uploads PDF in frontend.
2. Backend parses PDF text.
3. Text is sent to Gemini for summary/quiz.
4. Results are saved in MongoDB (user-scoped).
5. Frontend displays summary, quiz, flashcards, planner, and history.

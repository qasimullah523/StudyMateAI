# StudyMate AI API

Base URL: `http://localhost:8080`

## Auth

### Register
`POST /api/auth/register`

Body:
```json
{
  "name": "Qasim Ullah",
  "email": "you@university.edu",
  "password": "password123"
}
```

Response:
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "name": "...", "email": "...", "preferences": { "theme": "light" } }
}
```

### Login
`POST /api/auth/login`

Body:
```json
{
  "email": "you@university.edu",
  "password": "password123"
}
```

### Me
`GET /api/auth/me`

Headers:
`Authorization: Bearer <jwt>`

### Update Profile
`PUT /api/auth/profile`

Body:
```json
{
  "name": "New Name",
  "email": "new@university.edu",
  "password": "newpass123",
  "preferences": { "theme": "dark" }
}
```

## Upload + AI

### Upload PDF
`POST /api/upload`

Form-data:
- `file`: PDF

Headers (optional):
`Authorization: Bearer <jwt>`

Response:
```json
{
  "noteId": "...",
  "saved": true,
  "fileName": "Lecture.pdf",
  "summary": { "shortSummary": "...", "keyPoints": [], "keyConcepts": [], "formulas": [] },
  "quiz": { "questions": [] },
  "flashcards": []
}
```

### Summary
`POST /api/summary`

### Quiz
`POST /api/quiz`

### Explain
`POST /api/explain`

## Planner

### Generate Plan
`POST /api/planner`

Body:
```json
{
  "subjects": [{ "name": "Math", "difficulty": "hard" }],
  "examDate": "2026-06-01",
  "hoursPerDay": 3,
  "overallDifficulty": "medium"
}
```

## Notes (requires auth)

### List Notes
`GET /api/notes?limit=8&page=1`

### Search Notes
`GET /api/notes/search?q=sorting`

### Stats
`GET /api/notes/stats`

### Clear Notes
`DELETE /api/notes`

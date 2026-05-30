# StudyMateAI 📚✨

An intelligent AI-powered study companion designed to help university students maximize their learning efficiency. Upload your study materials, and StudyMateAI will generate summaries, quizzes, flashcards, and personalized study plans to accelerate your academic progress.

## 🎯 Overview

StudyMateAI is a full-stack web application that leverages AI technology to transform traditional study methods. Whether you're preparing for exams or mastering complex topics, StudyMateAI provides intelligent tools to enhance your learning experience.

### Key Features

- 🔐 **Secure Authentication** - JWT-based user authentication and authorization
- 📄 **Smart PDF Processing** - Upload and automatically parse PDF documents
- 🤖 **AI-Powered Learning**
  - Automated summaries of study materials
  - Generate practice quizzes to test knowledge
  - Create flashcards for quick revision
  - Personalized study plans
- 📊 **Learning Dashboard** - Track your progress and access your study history
- 🔍 **Full-Text Search** - Quickly find materials from your study library
- 🌙 **Dark Mode** - Comfortable studying in any environment

## 🏗️ Tech Stack

The project is built with a modern MERN stack:

- **Frontend**
  - React + TypeScript (Vite)
  - Tailwind CSS
  - React Router
  - DOMPurify + Marked (safe markdown rendering)

- **Backend**
  - Node.js + Express (TypeScript)
  - MongoDB + Mongoose
  - Google Generative AI (Gemini)
  - PDF parsing + audio book generation
  - JWT auth + bcrypt
  - CORS, Helmet, rate limiting

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB instance (local or Atlas)
- Google Generative AI API key

### Installation & Running Locally

#### Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

#### Run in development

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

Backend runs on `http://localhost:5000`.
Frontend runs on `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the backend directory with:

```
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_generative_ai_key
JWT_SECRET=your_jwt_secret
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Create a `.env` file in the frontend directory with:

```
VITE_API_BASE=http://localhost:5000
```

## 📁 Project Structure

```
StudyMateAI/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Express + TypeScript API
├── docs/              # Documentation
│   ├── ARCHITECTURE.md
│   └── API.md
└── README.md          # This file
```

## 💡 How It Works

1. **Upload** - Users securely upload PDF study materials
2. **Process** - Backend parses and extracts content from PDFs
3. **Generate** - AI analyzes content and creates learning materials
4. **Learn** - Users engage with summaries, quizzes, and flashcards
5. **Track** - Dashboard displays learning progress and history

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- CORS configuration for API security
- Helmet.js for HTTP security headers
- Rate limiting to prevent abuse
- Input validation and sanitization

## 📖 Documentation

For detailed information, see:

- **Architecture** - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Reference** - [docs/API.md](docs/API.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests to help improve StudyMateAI.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Created by [qasimullah523](https://github.com/qasimullah523)

---

**Happy Learning!** 🎓 Transform your study routine with StudyMateAI today!

```

```

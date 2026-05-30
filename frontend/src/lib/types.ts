export interface Summary {
  shortSummary: string;
  keyPoints: string[];
  keyConcepts: string[];
  formulas: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface PlannerSession {
  subject: string;
  hours: number;
}

export interface PlannerDay {
  label: string;
  date: string;
  sessions: PlannerSession[];
}

export interface PlannerPlan {
  startDate: string;
  days: number;
  hoursPerDay: number;
  schedule: PlannerDay[];
}

export interface NoteItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  summary?: Summary;
  quiz?: Quiz;
  flashcards?: Flashcard[];
}

export interface UserPreferences {
  theme?: "light" | "dark";
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

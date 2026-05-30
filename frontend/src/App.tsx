import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Quiz from "./pages/Quiz";
import Planner from "./pages/Planner";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

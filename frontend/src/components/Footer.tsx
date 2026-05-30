export default function Footer() {
  return (
    <footer className="border-t border-white/40 bg-white/70 px-6 py-4 text-xs text-slate-500 lg:px-10">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="text-sm font-semibold text-slate-700">
            StudyMate AI
          </div>
          <p className="mt-2 text-sm">
            AI study companion for university students.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-700">Contact</div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>+1 (555) 732-8844</li>
            <li>support@studymate.ai</li>
            <li>Campus Road, Lahore</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-700">
            Quick Links
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Upload Notes</li>
            <li>Generate Quiz</li>
            <li>Study Planner</li>
          </ul>
        </div>
      </div>
      <div className="mt-4 border-t border-white/40 pt-3">
        StudyMate AI - Hackathon demo build
      </div>
    </footer>
  );
}

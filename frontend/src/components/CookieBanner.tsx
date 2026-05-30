import { useEffect, useState } from "react";
import { getCookieChoice, setCookieChoice } from "../lib/storage";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = getCookieChoice();
    setVisible(!choice);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-30 w-[min(860px,92%)] -translate-x-1/2 rounded-2xl border border-white/50 bg-white/90 p-4 shadow-lg shadow-slate-900/10 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <strong className="text-sm text-slate-800">Cookie preferences</strong>
          <p className="mt-1 text-sm text-slate-500">
            We use cookies to remember your settings and improve your
            experience.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-slate-200/70 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600"
            onClick={() => {
              setCookieChoice("rejected");
              setVisible(false);
            }}
            type="button"
          >
            Reject all
          </button>
          <button
            className="rounded-full bg-gradient-to-r from-sky-500 to-amber-400 px-4 py-2 text-xs font-semibold text-slate-900"
            onClick={() => {
              setCookieChoice("accepted");
              setVisible(false);
            }}
            type="button"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

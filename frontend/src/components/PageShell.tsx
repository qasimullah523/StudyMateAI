import React from "react";
import Sidebar from "./Sidebar";
import HeaderBar from "./HeaderBar";
import Footer from "./Footer";
import CookieBanner from "./CookieBanner";

interface PageShellProps {
  title: string;
  subtitle?: string;
  compactHeader?: boolean;
  onAccountClick?: () => void;
  children: React.ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  compactHeader,
  onAccountClick,
  children,
}: PageShellProps) {
  return (
    <div className="relative">
      <div className="bg-shape shape-1" />
      <div className="bg-shape shape-2" />
      <div className="bg-shape shape-3" />

      <div className="app-shell relative z-10 flex min-h-screen flex-col lg:flex-row">
        <Sidebar onAccountClick={onAccountClick} />
        <div className="flex min-h-screen flex-1 flex-col">
          <HeaderBar
            title={title}
            subtitle={subtitle}
            compact={compactHeader}
            onAccountClick={onAccountClick}
          />
          <main className="flex-1 px-6 py-6 lg:px-10 lg:py-8">{children}</main>
          <Footer />
        </div>
      </div>

      <CookieBanner />
    </div>
  );
}

import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Genesis AI — Operator Console',
  description: 'AI Workforce Platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <nav className="nav">
          <span className="brand">⬡ Genesis AI</span>
          <a href="/dashboard">Dashboard</a>
          <a href="/review">Review Queue</a>
          <span className="spacer" />
          <a href="/login" className="muted">Logout</a>
        </nav>
        {children}
      </body>
    </html>
  );
}

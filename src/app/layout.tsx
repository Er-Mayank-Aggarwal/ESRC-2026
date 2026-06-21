import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "ESRC 2026 — Competition Dashboard",
  description:
    "ESRC 2026 competition dashboard. View team tasks, rankings, and the live leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary font-sans">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border-color py-5 text-center text-[11px] text-text-muted tracking-wide">
            © 2026 ESRC. All rights reserved.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

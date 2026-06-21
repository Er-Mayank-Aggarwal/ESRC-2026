"use client";

import { useEffect, useState } from "react";

interface InstallToastProps {
  title?: string;
  description?: string;
}

export default function InstallToast({ 
  title = "Install App", 
  description = "Get quick access from your home screen" 
}: InstallToastProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-4 rounded-xl border border-accent/20 bg-bg-secondary p-4 shadow-lg">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-text-primary">{title}</h3>
          <p className="text-[11px] text-text-muted mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={handleDismiss}
            className="rounded px-2.5 py-1.5 text-[11px] font-medium text-text-muted hover:bg-bg-tertiary transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="rounded bg-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

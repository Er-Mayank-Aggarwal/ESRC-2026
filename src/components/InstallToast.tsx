"use client";

import { useEffect, useState } from "react";

interface InstallToastProps {
  title?: string;
  description?: string;
  hideIconOnDismiss?: boolean;
}

type ViewState = "hidden" | "toast" | "icon";

export default function InstallToast({ 
  title = "Install App", 
  description = "Get quick access from your home screen",
  hideIconOnDismiss = false
}: InstallToastProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [viewState, setViewState] = useState<ViewState>("hidden");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setViewState("toast");
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
      setViewState("hidden");
    }
    setDeferredPrompt(null);
  };

  const handleDismissToIcon = () => {
    if (hideIconOnDismiss) {
      setViewState("hidden");
    } else {
      setViewState("icon");
    }
  };

  const handleExpandToToast = () => {
    setViewState("toast");
  };

  if (viewState === "hidden") return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {viewState === "icon" ? (
        <button
          onClick={handleExpandToToast}
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:bg-accent/90 animate-in slide-in-from-left-5 fade-in duration-300"
          title="Install App"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      ) : (
        <div className="flex w-[320px] max-w-[calc(100vw-3rem)] items-center gap-4 rounded-xl border border-accent/20 bg-bg-secondary p-4 shadow-lg animate-in slide-in-from-left-8 fade-in duration-400 ease-out">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-bold text-text-primary truncate">{title}</h3>
            <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{description}</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="rounded bg-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors text-center w-full"
            >
              Install
            </button>
            <button
              onClick={handleDismissToIcon}
              className="rounded px-3 py-1.5 text-[11px] font-medium text-text-muted hover:bg-bg-tertiary transition-colors text-center w-full"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

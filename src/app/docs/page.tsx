"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DocsPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <div className={`min-h-screen py-10 px-4 ${isDark ? "swagger-dark" : ""}`}>
      <div className="max-w-6xl mx-auto rounded-xl bg-bg-secondary p-4 shadow-[var(--card-shadow)] border border-border-color">
        <SwaggerUI url="/openapi.json" />
      </div>
      
      {/* Basic styles to make Swagger legible in dark mode if needed */}
      {isDark && (
        <style dangerouslySetInnerHTML={{ __html: `
          .swagger-dark .swagger-ui {
            filter: invert(88%) hue-rotate(180deg);
          }
          .swagger-dark .swagger-ui .microlight {
            filter: invert(100%) hue-rotate(180deg);
          }
        `}} />
      )}
    </div>
  );
}

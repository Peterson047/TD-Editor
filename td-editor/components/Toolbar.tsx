"use client";

import { useState } from "react";

interface ToolbarProps {
  onExportSVG: () => void;
  onExportPNG: () => void;
  onThemeChange: (theme: "dark" | "light") => void;
  currentTheme: "dark" | "light";
}

export default function Toolbar({
  onExportSVG,
  onExportPNG,
  onThemeChange,
  currentTheme,
}: ToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    setIsExporting(true);
    await onExportPNG();
    setIsExporting(false);
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h1
          className="text-sm font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          TD Graph Editor
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex rounded-lg p-0.5 border"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border)",
          }}
        >
          <button
            onClick={() => onThemeChange("dark")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTheme === "dark"
                ? "shadow-sm"
                : ""
            }`}
            style={
              currentTheme === "dark"
                ? {
                    backgroundColor: "var(--bg-quaternary)",
                    color: "var(--text-primary)",
                  }
                : {
                    color: "var(--text-muted)",
                  }
            }
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            Escuro
          </button>
          <button
            onClick={() => onThemeChange("light")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentTheme === "light"
                ? "shadow-sm"
                : ""
            }`}
            style={
              currentTheme === "light"
                ? {
                    backgroundColor: "var(--bg-quaternary)",
                    color: "var(--text-primary)",
                  }
                : {
                    color: "var(--text-muted)",
                  }
            }
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            Claro
          </button>
        </div>

        <div
          className="w-px h-6 mx-1"
          style={{ backgroundColor: "var(--border)" }}
        />

        <button
          onClick={onExportSVG}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border"
          style={{
            color: "var(--text-secondary)",
            borderColor: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-tertiary)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          SVG
        </button>

        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isExporting ? "Exportando..." : "PNG"}
        </button>
      </div>
    </header>
  );
}

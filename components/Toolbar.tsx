"use client";

import { useState } from "react";

interface ToolbarProps {
  onExportSVG: () => void;
  onExportPNG: () => void;
  onThemeChange: (theme: "dark" | "light") => void;
  currentTheme: "dark" | "light";
  mode: "code" | "visual";
  onModeChange: (mode: "code" | "visual") => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function Toolbar({
  onExportSVG,
  onExportPNG,
  onThemeChange,
  currentTheme,
  mode,
  onModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      await onExportPNG();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-5"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <svg
          width="32"
          height="32"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: "var(--accent)" }}
        >
          <rect x="0" y="0" width="80" height="80" rx="13" ry="13" fill="currentColor" />
          <text
            x="40"
            y="53"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="Inter, system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="34"
            fill="white"
            letterSpacing="-1"
          >
            TD
          </text>
        </svg>
        <h1 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          TD Graph Editor
        </h1>

        {/* Mode toggle */}
        <div
          className="ml-4 flex rounded-lg border p-0.5"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border)",
          }}
        >
          <button
            onClick={() => onModeChange("code")}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={
              mode === "code"
                ? {
                    backgroundColor: "var(--bg-quaternary)",
                    color: "var(--text-primary)",
                  }
                : { color: "var(--text-muted)" }
            }
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Código
          </button>
          <button
            onClick={() => onModeChange("visual")}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={
              mode === "visual"
                ? {
                    backgroundColor: "var(--bg-quaternary)",
                    color: "var(--text-primary)",
                  }
                : { color: "var(--text-muted)" }
            }
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Visual
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="ml-2 flex items-center gap-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-all disabled:opacity-30"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              if (canUndo) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-all disabled:opacity-30"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              if (canRedo) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex rounded-lg border p-0.5"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border)",
          }}
        >
          <button
            onClick={() => onThemeChange("dark")}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={
              currentTheme === "dark"
                ? {
                    backgroundColor: "var(--bg-quaternary)",
                    color: "var(--text-primary)",
                  }
                : { color: "var(--text-muted)" }
            }
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            Escuro
          </button>
          <button
            onClick={() => onThemeChange("light")}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
            style={
              currentTheme === "light"
                ? {
                    backgroundColor: "var(--bg-quaternary)",
                    color: "var(--text-primary)",
                  }
                : { color: "var(--text-muted)" }
            }
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            Claro
          </button>
        </div>

        <div className="mx-1 h-6 w-px" style={{ backgroundColor: "var(--border)" }} />

        <button
          onClick={onExportSVG}
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          SVG
        </button>

        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--accent)";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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

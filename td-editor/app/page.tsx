"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Toolbar from "@/components/Toolbar";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import { useMermaid } from "@/lib/useMermaid";

const defaultCode = `graph TD
  A[Início] --> B{Decisão}
  B -->|Sim| C[Ação 1]
  B -->|Não| D[Ação 2]
  C --> E[Fim]
  D --> E

  style A fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc
  style B fill:#334155,stroke:#f59e0b,stroke-width:2px,color:#f8fafc
  style C fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#f8fafc
  style D fill:#1e293b,stroke:#ef4444,stroke-width:2px,color:#f8fafc
  style E fill:#0f172a,stroke:#64748b,stroke-width:2px,color:#94a3b8`;

const MIN_LEFT_PCT = 25;
const MAX_LEFT_PCT = 75;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { containerRef: previewContainerRef, render, exportSVG, exportPNG } = useMermaid(theme);

  useEffect(() => {
    const timer = setTimeout(() => {
      render(code);
    }, 300);
    return () => clearTimeout(timer);
  }, [code, render]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setLeftWidthPct(Math.min(Math.max(pct, MIN_LEFT_PCT), MAX_LEFT_PCT));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const handleExportSVG = useCallback(() => {
    const svg = exportSVG();
    if (!svg) return;

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagrama-td-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportSVG]);

  const handleExportPNG = useCallback(async () => {
    const dataUrl = await exportPNG();
    if (!dataUrl) return;

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `diagrama-td-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [exportPNG]);

  return (
    <div className={`flex flex-col h-screen ${theme === "light" ? "theme-light" : ""}`}>
      <Toolbar
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onThemeChange={setTheme}
        currentTheme={theme}
      />
      <main
        ref={containerRef}
        className="flex flex-1 overflow-hidden relative"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Painel esquerdo — Editor */}
        <div
          className="flex flex-col border-r"
          style={{
            width: `${leftWidthPct}%`,
            minWidth: 280,
            borderColor: "var(--border)",
          }}
        >
          <Editor value={code} onChange={setCode} />
        </div>

        {/* Divisor arrastável */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 shrink-0 z-10 relative transition-colors duration-150 ${
            isDragging ? "bg-accent-500" : "bg-transparent hover:bg-accent-500/50"
          }`}
          style={{ cursor: "col-resize" }}
        >
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors duration-150 ${
              isDragging ? "bg-accent-400" : "bg-surface-600 hover:bg-accent-400"
            }`}
          />
        </div>

        {/* Painel direito — Preview */}
        <div className="flex-1 min-w-[280px] relative">
          <Preview containerRef={previewContainerRef} />
        </div>
      </main>
    </div>
  );
}

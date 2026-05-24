"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Toolbar from "@/components/Toolbar";
import Editor from "@/components/Editor";
import Preview from "@/components/Preview";
import VisualBuilder from "@/components/VisualBuilder";
import { useMermaid } from "@/lib/useMermaid";
import { useGraphHistory } from "@/lib/useGraphHistory";
import { GraphState, autoLayout, graphToMermaid, mergeMermaidWithPositions, mermaidToGraph } from "@/lib/graph";

const defaultCode = `graph TD
  A[Início] --> B{Decisão}
  B -->|Sim| C[Ação 1]
  B -->|Não| D[Ação 2]
  C --> E[Fim]`;

const MIN_LEFT_PCT = 25;
const MAX_LEFT_PCT = 75;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mode, setMode] = useState<"code" | "visual">("code");
  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    state: graphState,
    push: pushGraph,
    beginBatch,
    endBatch,
    commit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useGraphHistory(autoLayout(mermaidToGraph(defaultCode)));

  const { containerRef: previewContainerRef, render, exportSVG, exportPNG } = useMermaid(theme);

  useEffect(() => {
    const timer = setTimeout(() => {
      render(code);
    }, 200);
    return () => clearTimeout(timer);
  }, [code, render]);

  useEffect(() => {
    if (mode === "visual") {
      const newCode = graphToMermaid(graphState);
      if (newCode !== code) {
        setCode(newCode);
      }
    }
  }, [graphState, mode, code]);

  const handleGraphChange = useCallback(
    (updater: GraphState | ((prev: GraphState) => GraphState)) => {
      pushGraph(updater);
    },
    [pushGraph]
  );

  const handleModeChange = useCallback(
    (newMode: "code" | "visual") => {
      if (newMode === "visual" && mode !== "visual") {
        pushGraph((prev) => mergeMermaidWithPositions(code, prev));
      }
      setMode(newMode);
    },
    [code, mode, pushGraph]
  );

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
    <div className={`flex h-screen flex-col ${theme === "light" ? "theme-light" : ""}`}>
      <Toolbar
        onExportSVG={handleExportSVG}
        onExportPNG={handleExportPNG}
        onThemeChange={setTheme}
        currentTheme={theme}
        mode={mode}
        onModeChange={handleModeChange}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <main
        ref={containerRef}
        className="relative flex flex-1 overflow-hidden"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div
          className="flex flex-col border-r"
          style={{
            width: `${leftWidthPct}%`,
            minWidth: 280,
            borderColor: "var(--border)",
          }}
        >
          {mode === "code" ? (
            <Editor value={code} onChange={setCode} />
          ) : (
            <VisualBuilder
              state={graphState}
              onChange={handleGraphChange}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              beginBatch={beginBatch}
              endBatch={endBatch}
              commit={commit}
            />
          )}
        </div>

        <div
          onMouseDown={handleMouseDown}
          className={`relative z-10 w-1.5 shrink-0 transition-colors duration-150 ${
            isDragging ? "bg-accent-500" : "bg-transparent hover:bg-accent-500/50"
          }`}
          style={{ cursor: "col-resize" }}
        >
          <div
            className={`absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-150 ${
              isDragging ? "bg-accent-400" : "bg-surface-600 hover:bg-accent-400"
            }`}
          />
        </div>

        <div className="relative min-w-[280px] flex-1">
          <Preview containerRef={previewContainerRef} />
        </div>
      </main>
    </div>
  );
}

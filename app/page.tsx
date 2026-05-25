"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Toolbar from "@/components/Toolbar";
import Editor from "@/components/Editor";
import Preview, { PreviewHandle } from "@/components/Preview";
import VisualBuilder from "@/components/VisualBuilder";
import { useGraphHistory } from "@/lib/useGraphHistory";
import { GraphState, autoLayout, graphToMermaid, mergeMermaidWithPositions, mermaidToGraph } from "@/lib/graph";

const defaultCode = `graph TD
  A[Início] --> B{Decisão}
  B -->|Sim| C[Ação 1]
  B -->|Não| D[Ação 2]
  C --> E[Fim]`;

const MIN_LEFT_PCT = 25;
const MAX_LEFT_PCT = 75;
const MIN_TOP_PCT = 25;
const MAX_TOP_PCT = 75;

export default function Home() {
  const [code, setCode] = useState(defaultCode);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mode, setMode] = useState<"code" | "visual">("code");

  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [topHeightPct, setTopHeightPct] = useState(50);
  const [isVDragging, setIsVDragging] = useState(false);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

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

  const previewMobileRef = useRef<PreviewHandle>(null);
  const previewDesktopRef = useRef<PreviewHandle>(null);

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

  // Desktop splitter (horizontal)
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

  // Mobile splitter (vertical) — touch support
  useEffect(() => {
    if (!isVDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!mobileContainerRef.current) return;
      const rect = mobileContainerRef.current.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      const pct = (y / rect.height) * 100;
      setTopHeightPct(Math.min(Math.max(pct, MIN_TOP_PCT), MAX_TOP_PCT));
    };

    const handleTouchEnd = () => {
      setIsVDragging(false);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
      document.body.style.userSelect = "";
    };
  }, [isVDragging]);

  const handleExportSVG = useCallback(() => {
    const preview = previewMobileRef.current || previewDesktopRef.current;
    const svg = preview?.exportSVG();
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
  }, []);

  const handleExportPNG = useCallback(async () => {
    const preview = previewMobileRef.current || previewDesktopRef.current;
    const dataUrl = await preview?.exportPNG();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `diagrama-td-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const editorPanel = (
    <div className="flex h-full flex-col border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--border)" }}>
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
  );

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

      {/* Mobile layout */}
      <div ref={mobileContainerRef} className="flex flex-1 flex-col overflow-hidden md:hidden" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div style={{ flex: `${topHeightPct} 1 0%`, minHeight: 0 }}>{editorPanel}</div>
        <div
          onMouseDown={() => setIsVDragging(true)}
          onTouchStart={() => setIsVDragging(true)}
          className={`relative z-10 h-1.5 shrink-0 transition-colors duration-150 ${
            isVDragging ? "bg-accent-500" : "bg-transparent hover:bg-accent-500/50"
          }`}
          style={{ cursor: "row-resize" }}
        >
          <div
            className={`absolute left-1/2 top-1/2 h-1 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-150 ${
              isVDragging ? "bg-accent-400" : "bg-surface-600 hover:bg-accent-400"
            }`}
          />
        </div>
        <div style={{ flex: `${100 - topHeightPct} 1 0%`, minHeight: 0 }}>
          <Preview ref={previewMobileRef} code={code} theme={theme} />
        </div>
      </div>

      {/* Desktop layout */}
      <main
        ref={containerRef}
        className="hidden flex-1 flex-row overflow-hidden md:flex"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        <div
          className="flex flex-col"
          style={{
            width: `${leftWidthPct}%`,
            minWidth: 280,
          }}
        >
          {editorPanel}
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

        <div className="relative min-h-0 min-w-0 flex-1">
          <Preview ref={previewDesktopRef} code={code} theme={theme} />
        </div>
      </main>
    </div>
  );
}

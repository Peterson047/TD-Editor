"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface PreviewProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function Preview({ containerRef }: PreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.2), 20);
      return Math.round(next * 10) / 10;
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      e.preventDefault();
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        translateX: translate.x,
        translateY: translate.y,
      };
    },
    [translate]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTranslate({
        x: panStart.current.translateX + dx,
        y: panStart.current.translateY + dy,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(Math.round((prev + 0.2) * 10) / 10, 20));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(Math.round((prev - 0.2) * 10) / 10, 0.2));
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--preview-bg)" }}>
      <div
        className="flex h-9 shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Preview
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}
            title="Zoom out"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="w-10 select-none text-center font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}
            title="Zoom in"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className="mx-1 h-4 w-px" style={{ backgroundColor: "var(--border)" }} />
          <button
            onClick={resetView}
            className="rounded px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--text-secondary)" }}
            title="Reset view"
          >
            Reset
          </button>
        </div>
      </div>
      <div
        ref={wrapperRef}
        className={`flex flex-1 select-none items-center justify-center overflow-hidden ${isPanning ? "is-panning" : "preview-container"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          <div ref={containerRef} className="animate-fade-in" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-3 right-3 rounded-md px-2 py-1 text-[10px] opacity-60"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-muted)",
        }}
      >
        Ctrl + scroll para zoom · Arraste para mover
      </div>
    </div>
  );
}

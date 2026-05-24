"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mermaid from "mermaid";

let mermaidInitialized = false;

const svgStyles = (theme: "dark" | "light") => `
  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    filter: ${
      theme === "dark"
        ? "drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
        : "drop-shadow(0 2px 6px rgba(15,23,42,0.08))"
    };
    stroke-width: 1.5px !important;
    transition: all 0.2s ease;
  }
  .node:hover rect,
  .node:hover circle,
  .node:hover ellipse,
  .node:hover polygon,
  .node:hover path {
    filter: ${
      theme === "dark"
        ? "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"
        : "drop-shadow(0 4px 12px rgba(15,23,42,0.12))"
    };
    stroke-width: 2px !important;
  }
  .edgePath .path {
    stroke-width: 2px !important;
    stroke-linecap: round;
    opacity: 0.85;
  }
  .edgeLabel {
    font-family: 'Inter', system-ui, sans-serif !important;
    font-size: 12px !important;
    font-weight: 500 !important;
  }
  .edgeLabel rect {
    fill: ${theme === "dark" ? "#0f172a" : "#ffffff"} !important;
    stroke: ${theme === "dark" ? "#334155" : "#e2e8f0"} !important;
    stroke-width: 1px !important;
    rx: 4px !important;
    ry: 4px !important;
    filter: ${
      theme === "dark"
        ? "drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
        : "drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
    };
  }
  text {
    font-family: 'Inter', system-ui, sans-serif !important;
    font-weight: 500 !important;
  }
  .cluster rect {
    fill: ${theme === "dark" ? "rgba(30,41,59,0.4)" : "rgba(241,245,249,0.6)"} !important;
    stroke: ${theme === "dark" ? "#475569" : "#cbd5e1"} !important;
    stroke-width: 1px !important;
    stroke-dasharray: 6,4 !important;
    rx: 8px !important;
    ry: 8px !important;
  }
  .cluster text {
    fill: ${theme === "dark" ? "#94a3b8" : "#64748b"} !important;
    font-size: 13px !important;
    font-weight: 600 !important;
  }
  .label text {
    fill: ${theme === "dark" ? "#f1f5f9" : "#1e293b"} !important;
  }
`;

const getMermaidConfig = (theme: "dark" | "light") => ({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
    padding: 24,
    nodeSpacing: 48,
    rankSpacing: 64,
    diagramPadding: 16,
  },
  themeVariables:
    theme === "dark"
      ? {
          darkMode: true,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "13px",

          /* Nós padrão */
          primaryColor: "#1e293b",
          primaryTextColor: "#f1f5f9",
          primaryBorderColor: "#475569",

          /* Variantes */
          secondaryColor: "#0f172a",
          tertiaryColor: "#334155",

          /* Linhas e setas */
          lineColor: "#64748b",
          edgeLabelBackground: "#0f172a",

          /* Clusters / subgraphs */
          clusterBkg: "rgba(30,41,59,0.3)",
          clusterBorder: "#475569",

          /* Nós específicos por tipo */
          nodeTextColor: "#f1f5f9",
          nodeBorder: "#475569",
          nodeBkg: "#1e293b",

          /* Cores da escala para variedade */
          cScale0: "#1e293b",
          cScale1: "#334155",
          cScale2: "#1e3a5f",
          cScale3: "#0f172a",
        }
      : {
          darkMode: false,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "13px",

          primaryColor: "#ffffff",
          primaryTextColor: "#1e293b",
          primaryBorderColor: "#e2e8f0",

          secondaryColor: "#f8fafc",
          tertiaryColor: "#f1f5f9",

          lineColor: "#94a3b8",
          edgeLabelBackground: "#ffffff",

          clusterBkg: "rgba(241,245,249,0.5)",
          clusterBorder: "#cbd5e1",

          nodeTextColor: "#1e293b",
          nodeBorder: "#e2e8f0",
          nodeBkg: "#ffffff",

          cScale0: "#ffffff",
          cScale1: "#f8fafc",
          cScale2: "#eff6ff",
          cScale3: "#f0fdf4",
        },
});

export function initMermaid(theme: "dark" | "light") {
  if (mermaidInitialized) return;
  mermaid.initialize(getMermaidConfig(theme));
  mermaidInitialized = true;
}

export function useMermaid(theme: "dark" | "light") {
  const containerRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initMermaid(theme);
    setIsReady(true);
  }, [theme]);

  useEffect(() => {
    mermaid.initialize(getMermaidConfig(theme));
  }, [theme]);

  const injectStyles = useCallback(
    (svgElement: SVGElement) => {
      const existing = svgElement.querySelector("style[data-td-editor]");
      if (existing) existing.remove();
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.setAttribute("data-td-editor", "true");
      style.textContent = svgStyles(theme);
      svgElement.insertBefore(style, svgElement.firstChild);
    },
    [theme]
  );

  const render = useCallback(
    async (code: string) => {
      if (!containerRef.current || !isReady) return;

      const id = `mermaid-${Date.now()}-${idCounter.current++}`;
      try {
        const { svg } = await mermaid.render(id, code);
        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector("svg");
        if (svgEl) injectStyles(svgEl);
      } catch (err) {
        containerRef.current.innerHTML = `<div style="color: ${
          theme === "dark" ? "#f87171" : "#dc2626"
        }; font-size: 0.875rem; padding: 1rem; font-family: monospace;">${
          err instanceof Error ? err.message : "Erro ao renderizar diagrama"
        }</div>`;
      }
    },
    [isReady, theme, injectStyles]
  );

  const exportSVG = useCallback(() => {
    if (!containerRef.current) return null;
    const svg = containerRef.current.querySelector("svg");
    if (!svg) return null;
    return svg.outerHTML;
  }, []);

  const exportPNG = useCallback(() => {
    return new Promise<string | null>((resolve) => {
      if (!containerRef.current) return resolve(null);
      const svg = containerRef.current.querySelector("svg");
      if (!svg) return resolve(null);

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      const img = new Image();
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const rect = svg.getBoundingClientRect();
        const scale = 2;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        ctx.scale(scale, scale);
        ctx.fillStyle = theme === "dark" ? "#0f172a" : "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    });
  }, [theme]);

  return { containerRef, render, exportSVG, exportPNG };
}

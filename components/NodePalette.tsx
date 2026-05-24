"use client";

import { NodeType } from "@/lib/graph";

const NODE_TYPES: { type: NodeType; label: string; icon: string }[] = [
  { type: "rect", label: "Processo", icon: "▭" },
  { type: "rounded", label: "Início/Fim", icon: "▢" },
  { type: "diamond", label: "Decisão", icon: "◊" },
  { type: "circle", label: "Conector", icon: "○" },
  { type: "stadium", label: "Terminal", icon: "▭" },
  { type: "subroutine", label: "Sub-rotina", icon: "▭" },
  { type: "cylinder", label: "Banco", icon: "▭" },
  { type: "parallelogram", label: "Entrada", icon: "▱" },
];

interface NodePaletteProps {
  onAdd: (type: NodeType) => void;
}

export default function NodePalette({ onAdd }: NodePaletteProps) {
  return (
    <div
      className="flex h-9 items-center gap-1 border-b px-3"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <span
        className="mr-2 shrink-0 text-[10px] font-medium uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        Adicionar
      </span>
      {NODE_TYPES.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          title={label}
          className="flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition-all"
          style={{
            color: "var(--text-secondary)",
            borderColor: "transparent",
            backgroundColor: "transparent",
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
          <span className="text-xs opacity-70">{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

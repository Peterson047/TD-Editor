"use client";

import { useCallback, useEffect, useState } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    setLineCount(value.split("\n").length);
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.target as HTMLTextAreaElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--editor-bg)" }}>
      <div
        className="h-9 flex items-center px-4 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Editor
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-12 shrink-0 border-r overflow-hidden select-none"
          style={{
            backgroundColor: "var(--editor-gutter)",
            borderColor: "var(--border)",
          }}
        >
          <div className="py-4 text-right pr-3">
            {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
              <div
                key={i}
                className="text-[11px] leading-[1.6rem] font-mono editor-line-number"
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="editor-textarea flex-1 resize-none p-4 outline-none border-none focus:ring-0"
        />
      </div>
    </div>
  );
}

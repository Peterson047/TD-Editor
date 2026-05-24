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
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--editor-bg)" }}>
      <div className="flex h-9 shrink-0 items-center border-b px-4" style={{ borderColor: "var(--border)" }}>
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Editor
        </span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-12 shrink-0 select-none overflow-hidden border-r"
          style={{
            backgroundColor: "var(--editor-gutter)",
            borderColor: "var(--border)",
          }}
        >
          <div className="py-4 pr-3 text-right">
            {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
              <div key={i} className="editor-line-number font-mono text-[11px] leading-[1.6rem]">
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
          className="editor-textarea flex-1 resize-none border-none p-4 outline-none focus:ring-0"
        />
      </div>
    </div>
  );
}

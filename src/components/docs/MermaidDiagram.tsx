"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

export default function MermaidDiagram({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({ startOnLoad: false, theme: "dark" });
      initialized = true;
    }

    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    mermaid.render(id, code).then(({ svg: rendered }) => {
      setSvg(rendered);
    });
  }, [code]);

  if (!svg) {
    return (
      // Use <span> with display:block/flex to avoid invalid <p><div></p> nesting
      // when ReactMarkdown wraps custom HTML elements in a paragraph.
      <span
        className="bg-sunny-bg border border-sunny-surface-light rounded-md p-4 my-3 min-h-[120px]"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          className="text-sunny-cream-muted"
        >
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm italic">Rendering diagram...</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className="bg-sunny-bg border border-sunny-surface-light rounded-md p-4 my-3 overflow-x-auto"
      style={{ display: "block" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

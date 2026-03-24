"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { visit } from "unist-util-visit";
import type { Root, Code } from "mdast";

/** Remark plugin: assign a default lang to fenced code blocks without one.
 *  This ensures the code component always receives a className for block code,
 *  distinguishing it from inline code (which never has a className). */
function remarkDefaultCodeLang() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code) => {
      if (!node.lang) node.lang = "plaintext";
    });
  };
}

/** Build the markdown component overrides object */
export function createMarkdownComponents(
  currentPath: string,
  loadFile: (path: string) => void,
) {
  return {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-2xl font-bold text-sunny-gold mb-4 mt-6 first:mt-0 border-b border-sunny-surface-light pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-xl font-bold text-sunny-gold mb-3 mt-6">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-lg font-semibold text-sunny-gold mb-2 mt-4">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-base font-semibold text-sunny-cream mb-2 mt-3">
        {children}
      </h4>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-sunny-cream text-sm leading-relaxed mb-3">
        {children}
      </p>
    ),
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      // Internal doc link: relative .md file or docs/ directory
      const isExternal = href?.startsWith("http") || href?.startsWith("mailto:");
      const isDocLink = !isExternal && href && (href.endsWith(".md") || href.startsWith("docs/"));

      if (isDocLink) {
        // Resolve relative path based on current file location
        let resolved = href;
        if (!href.startsWith("docs/") && !href.startsWith("README.md")) {
          const dir = currentPath.substring(0, currentPath.lastIndexOf("/"));
          resolved = dir ? `${dir}/${href}` : href;
        }
        // Strip trailing slash for directory refs
        resolved = resolved.replace(/\/$/, "");
        // If it's a directory, try its README
        if (!resolved.endsWith(".md")) {
          resolved = `${resolved}/README.md`;
        }

        return (
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); loadFile(resolved); }}
            className="text-sunny-gold hover:text-sunny-gold-muted underline cursor-pointer"
          >
            {children}
          </a>
        );
      }

      return (
        <a
          href={href}
          className="text-sunny-gold hover:text-sunny-gold-muted underline"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    },
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside text-sunny-cream text-sm mb-3 space-y-1 ml-2">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside text-sunny-cream text-sm mb-3 space-y-1 ml-2">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li className="text-sunny-cream text-sm">{children}</li>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-sunny-gold-muted pl-4 my-3 italic text-sunny-cream-muted">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="border-sunny-surface-light my-6" />
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-sunny-surface-light">
        {children}
      </thead>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="text-left text-sunny-gold font-semibold px-3 py-2 border border-sunny-surface-light">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="text-sunny-cream px-3 py-2 border border-sunny-surface-light">
        {children}
      </td>
    ),
    img: ({ src, alt }: { src?: string | Blob; alt?: string }) => {
      const strSrc = typeof src === "string" ? src : undefined;
      const isMermaid = typeof strSrc === "string" && strSrc.includes("mermaid.ink/");
      if (isMermaid) {
        return (
          <div className="bg-sunny-bg border border-sunny-surface-light rounded-md p-4 my-3 overflow-x-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={strSrc}
              alt={alt ?? ""}
              className="block w-full"
            />
          </div>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={strSrc}
          alt={alt ?? ""}
          className="inline-block max-w-full rounded-md align-middle mr-1"
        />
      );
    },
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-sunny-cream">
        {children}
      </strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-sunny-cream-muted">
        {children}
      </em>
    ),
    code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
      const match = /language-(\w+)/.exec(className ?? "");
      const lang = match?.[1];

      // Block code with a real language -> syntax highlight
      if (lang && lang !== "plaintext") {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={lang}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: 0,
              background: "transparent",
              fontSize: "13px",
              lineHeight: 1.4,
              fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        );
      }

      // Plaintext block code (ASCII diagrams, etc.)
      if (className) {
        return (
          <code
            className="block text-[13px] text-sunny-cream whitespace-pre"
            style={{ fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace", lineHeight: 1.4 }}
          >
            {children}
          </code>
        );
      }

      // Inline code
      return (
        <code
          className="bg-sunny-surface-light text-sunny-gold px-1.5 py-0.5 rounded text-xs"
          style={{ fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace" }}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: { children?: React.ReactNode; className?: string }) => {
      // Check if the child code element is plaintext (ASCII diagram)
      const child = Array.isArray(children) ? children[0] : children;
      const isPlaintext =
        child &&
        typeof child === "object" &&
        "props" in child &&
        typeof child.props?.className === "string" &&
        child.props.className.includes("language-plaintext");

      return (
        <pre
          {...props}
          className="bg-sunny-bg border border-sunny-surface-light rounded-md p-4 my-3 overflow-x-auto"
          style={{
            fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
            ...(isPlaintext ? { width: "fit-content", marginInline: "auto" } : {}),
          }}
        >
          {children}
        </pre>
      );
    },
  };
}

export default function MarkdownRenderer({
  content,
  currentPath,
  loadFile,
}: {
  content: string;
  currentPath: string;
  loadFile: (path: string) => void;
}) {
  const components = createMarkdownComponents(currentPath, loadFile);

  return (
    <div className="docs-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDefaultCodeLang]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Site-wide emdash guard.
 *
 * Scans all TypeScript/TSX source files under src/ for the em dash character
 * (U+2014 "—") inside string literals and JSX text. Fails if any are found,
 * reporting every file and line so they can be fixed in one pass.
 *
 * Comments are excluded — only user-visible strings and template literals are
 * flagged.
 */

import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve(__dirname, "../../src");
const EMDASH = "\u2014"; // —

/** Recursively collect .ts and .tsx files. */
function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * For each line of source, return the line with comment content replaced by
 * spaces (preserving line count). Handles single-line //, multi-line blocks,
 * and skips into string/template literals so emdashes inside strings are kept.
 *
 * Returns an array with the same length as the input lines array — line numbers
 * stay aligned with the original file.
 */
function stripCommentsPerLine(source: string): string[] {
  const output: string[] = [];
  let inBlockComment = false;
  const lines = source.split("\n");

  for (const line of lines) {
    let cleaned = "";
    let i = 0;

    while (i < line.length) {
      // Inside a block comment — look for closing */
      if (inBlockComment) {
        if (line[i] === "*" && line[i + 1] === "/") {
          i += 2;
          inBlockComment = false;
        } else {
          i++;
        }
        continue;
      }

      const ch = line[i];
      const next = line[i + 1];

      // Single-line comment — rest of line is a comment
      if (ch === "/" && next === "/") {
        break;
      }

      // Multi-line comment start
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }

      // String/template literal — pass through verbatim
      if (ch === '"' || ch === "'" || ch === "`") {
        const quote = ch;
        cleaned += line[i++];
        while (i < line.length) {
          if (line[i] === "\\" && quote !== "`") {
            cleaned += line[i++];
            if (i < line.length) cleaned += line[i++];
            continue;
          }
          if (line[i] === quote) {
            cleaned += line[i++];
            break;
          }
          cleaned += line[i++];
        }
        continue;
      }

      cleaned += line[i++];
    }

    output.push(cleaned);
  }

  return output;
}

describe("No emdash in user-visible UI", () => {
  const files = collectSourceFiles(SRC_DIR);

  it("should find source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("should not contain em dash (U+2014) in any source string or JSX text", () => {
    const violations: string[] = [];

    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const strippedLines = stripCommentsPerLine(raw);
      const originalLines = raw.split("\n");

      for (let lineIdx = 0; lineIdx < strippedLines.length; lineIdx++) {
        if (strippedLines[lineIdx].includes(EMDASH)) {
          const rel = path.relative(SRC_DIR, filePath).replace(/\\/g, "/");
          violations.push(
            `  ${rel}:${lineIdx + 1}  ${originalLines[lineIdx].trim()}`
          );
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} em dash violation(s) in source files:\n\n` +
          violations.join("\n") +
          "\n\nReplace \u2014 (em dash) with - (hyphen) in user-visible text."
      );
    }
  });
});

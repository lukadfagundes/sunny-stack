import type { Metadata } from "next";
import { headers } from "next/headers";
import DocsClient from "@/components/docs/DocsClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>;
}): Promise<Metadata> {
  const { file } = await searchParams;
  const filePath = file ?? "README.md";
  const fileName =
    filePath.split("/").pop()?.replace(".md", "") ?? "Documentation";
  const title = fileName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${title} — sunny-stack.com Docs`,
    description: `Technical documentation for sunny-stack.com: ${title}`,
  };
}

export default async function DocsPage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>;
}) {
  const { file } = await searchParams;
  const requestedPath = file ?? "README.md";

  // Fetch from the API route which has proven file tracing on Vercel.
  // Direct fs reads from page routes have unreliable outputFileTracingIncludes
  // support in Next.js App Router (see vercel/next.js#55228).
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const [treeRes, contentRes] = await Promise.all([
    fetch(`${baseUrl}/api/docs?list=true`),
    fetch(`${baseUrl}/api/docs?path=${encodeURIComponent(requestedPath)}`),
  ]);

  const treeData = await treeRes.json();
  const contentData = await contentRes.json();

  const tree = treeData.files ?? [];
  let content = contentData.content ?? "";

  // Fallback to README.md if requested file not found
  if (!content && requestedPath !== "README.md") {
    const fallbackRes = await fetch(`${baseUrl}/api/docs?path=README.md`);
    const fallbackData = await fallbackRes.json();
    content = fallbackData.content ?? "";
  }

  return (
    <DocsClient
      files={tree}
      initialPath={requestedPath}
      initialContent={content}
    />
  );
}

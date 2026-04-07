import type { Metadata } from "next";
import { getDocTree, getDocContent } from "@/lib/docs";
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

  const tree = getDocTree();
  const content =
    getDocContent(requestedPath) ?? getDocContent("README.md") ?? "";

  return (
    <DocsClient
      files={tree}
      initialPath={requestedPath}
      initialContent={content}
    />
  );
}

"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Repeat2, CloudSun } from "lucide-react";
import Image from "next/image";
import { profile } from "@/lib/data/personal";
import type {
  BlueskyPost,
  BlueskyFacet,
} from "@/app/api/bluesky/route";

/**
 * Build rich text segments from Bluesky facets.
 * Facets use UTF-8 byte offsets — we use TextEncoder/TextDecoder
 * to slice correctly for emoji and multibyte characters.
 */
interface RichSegment {
  text: string;
  link?: string;  // external link URI
  tag?: string;   // hashtag (without #)
  mention?: string; // mention DID
}

function buildSegments(text: string, facets: BlueskyFacet[]): RichSegment[] {
  if (!facets.length) return [{ text }];

  const encoder = new TextEncoder();
  const utf8 = encoder.encode(text);
  const sorted = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart
  );
  const decoder = new TextDecoder();
  const segments: RichSegment[] = [];
  let lastEnd = 0;

  for (const facet of sorted) {
    // Plain text before this facet
    if (lastEnd < facet.index.byteStart) {
      segments.push({
        text: decoder.decode(utf8.slice(lastEnd, facet.index.byteStart)),
      });
    }

    const segText = decoder.decode(
      utf8.slice(facet.index.byteStart, facet.index.byteEnd)
    );
    const feature = facet.features[0];

    if (feature?.$type === "app.bsky.richtext.facet#link") {
      segments.push({ text: segText, link: feature.uri });
    } else if (feature?.$type === "app.bsky.richtext.facet#tag") {
      segments.push({ text: segText, tag: feature.tag });
    } else if (feature?.$type === "app.bsky.richtext.facet#mention") {
      segments.push({ text: segText, mention: feature.did });
    } else {
      segments.push({ text: segText });
    }

    lastEnd = facet.index.byteEnd;
  }

  // Remaining text after last facet
  if (lastEnd < utf8.byteLength) {
    segments.push({ text: decoder.decode(utf8.slice(lastEnd)) });
  }

  return segments;
}

export default function BlogEntry() {
  const [post, setPost] = useState<BlueskyPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/bluesky")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: BlueskyPost | null) => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const segments = post ? buildSegments(post.text, post.facets) : [];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        border: "1px solid #1D3044",
      }}
    >
      {/* Bluesky-styled header */}
      <h3
        className="font-bold text-base px-3 py-2 mb-0 flex items-center gap-2"
        style={{
          background: "#0560FF",
          color: "#FFFFFF",
        }}
      >
        <CloudSun className="w-4 h-4" />
        {profile.name}&apos;s Latest Blog Entry
      </h3>

      {/* Content area */}
      <div className="px-4 py-3" style={{ background: "#0A1929" }}>
        {/* Loading */}
        {loading && (
          <div className="space-y-2">
            <div
              className="h-4 w-3/4 animate-pulse rounded"
              style={{ background: "#1D3044" }}
            />
            <div
              className="h-4 w-1/2 animate-pulse rounded"
              style={{ background: "#1D3044" }}
            />
            <div
              className="h-3 w-32 animate-pulse rounded mt-3"
              style={{ background: "#1D3044" }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm" style={{ color: "#8899A6" }}>
            Could not load latest post.
          </p>
        )}

        {/* Empty */}
        {!loading && !error && !post && (
          <p className="text-sm" style={{ color: "#8899A6" }}>
            No posts to display.
          </p>
        )}

        {/* Post content */}
        {!loading && !error && post && (
          <>
            {/* Rich text */}
            <p
              className="text-sm whitespace-pre-line"
              style={{ color: "#E4E8EC", lineHeight: "1.6" }}
            >
              {segments.map((seg, i) => {
                if (seg.link) {
                  return (
                    <a
                      key={i}
                      href={seg.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#208BFE" }}
                      className="hover:underline"
                    >
                      {seg.text}
                    </a>
                  );
                }
                if (seg.tag) {
                  return (
                    <a
                      key={i}
                      href={`https://bsky.app/search?q=%23${encodeURIComponent(seg.tag)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#208BFE" }}
                      className="hover:underline"
                    >
                      {seg.text}
                    </a>
                  );
                }
                if (seg.mention) {
                  return (
                    <a
                      key={i}
                      href={`https://bsky.app/profile/${seg.mention}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#208BFE" }}
                      className="hover:underline"
                    >
                      {seg.text}
                    </a>
                  );
                }
                return <span key={i}>{seg.text}</span>;
              })}
            </p>

            {/* External embed card */}
            {post.embed?.type === "external" && post.embed.external && (
              <a
                href={post.embed.external.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-3 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                style={{
                  border: "1px solid #1D3044",
                  background: "#0D1F33",
                }}
              >
                {post.embed.external.thumb && (
                  <div className="relative w-full aspect-video">
                    <Image
                      src={post.embed.external.thumb}
                      alt={post.embed.external.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 500px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="px-3 py-2">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "#E4E8EC" }}
                  >
                    {post.embed.external.title}
                  </p>
                  <p
                    className="text-xs mt-0.5 line-clamp-2"
                    style={{ color: "#8899A6" }}
                  >
                    {post.embed.external.description}
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "#536471" }}
                  >
                    {new URL(post.embed.external.uri).hostname}
                  </p>
                </div>
              </a>
            )}

            {/* Image embed */}
            {post.embed?.type === "images" && post.embed.images && (
              <div
                className={`mt-3 gap-1 ${
                  post.embed.images.length === 1
                    ? ""
                    : "grid grid-cols-2"
                }`}
              >
                {post.embed.images.map((img, i) => (
                  <a
                    key={i}
                    href={img.fullsize}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-video rounded-lg overflow-hidden"
                    style={{ border: "1px solid #1D3044" }}
                  >
                    <Image
                      src={img.thumb}
                      alt={img.alt || "Post image"}
                      fill
                      sizes="(max-width: 640px) 100vw, 300px"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Engagement row */}
            <div
              className="flex items-center gap-5 mt-3"
              style={{ color: "#8899A6" }}
            >
              <span className="flex items-center gap-1.5 text-xs">
                <Heart className="w-3.5 h-3.5" />
                {post.likeCount}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <MessageCircle className="w-3.5 h-3.5" />
                {post.replyCount}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Repeat2 className="w-3.5 h-3.5" />
                {post.repostCount}
              </span>
            </div>

            {/* Date */}
            <p className="text-xs mt-2" style={{ color: "#536471" }}>
              {new Date(post.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

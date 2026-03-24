"use client";

import { useState } from "react";
import { ThumbsUp, MessageSquare, Eye, ChevronDown, ChevronUp } from "lucide-react";
import type { YouTubeVideo } from "@/app/api/youtube/route";

interface VideoCardProps {
  video: YouTubeVideo;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function VideoCard({ video }: VideoCardProps) {
  const [descOpen, setDescOpen] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid #272727" }}>
      {/* Embedded video */}
      <div className="aspect-video relative overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${video.id}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups"
          className="absolute inset-0 w-full h-full"
          style={{ border: "none" }}
        />
      </div>

      {/* Title + engagement + description */}
      <div className="px-3 pt-3 pb-8">
        {/* Title */}
        <h3
          className="text-base font-medium mb-2 leading-snug"
          style={{ color: "#F1F1F1", fontFamily: "Roboto, Arial, sans-serif" }}
        >
          {video.title}
        </h3>

        {/* Engagement row */}
        <div
          className="flex items-center gap-4 mb-2"
          style={{ color: "#AAAAAA" }}
        >
          <span className="flex items-center gap-1.5 text-sm">
            <Eye className="w-4 h-4" />
            {formatCount(video.viewCount)}
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <ThumbsUp className="w-4 h-4" />
            {formatCount(video.likeCount)}
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="w-4 h-4" />
            {formatCount(video.commentCount)}
          </span>
        </div>

        {/* Description toggle */}
        {video.description && (
          <>
            <button
              onClick={() => setDescOpen((o) => !o)}
              className="flex items-center gap-1 text-sm mt-1 bg-transparent border-none p-0 cursor-pointer"
              style={{ color: "#AAAAAA", fontFamily: "Roboto, Arial, sans-serif" }}
            >
              {descOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide description
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Description
                </>
              )}
            </button>
            {descOpen && (
              <p
                className="text-sm mt-2 whitespace-pre-line"
                style={{ color: "#AAAAAA", fontFamily: "Roboto, Arial, sans-serif" }}
              >
                {video.description}
              </p>
            )}
          </>
        )}

        {/* Date */}
        <p
          className="text-xs mt-2"
          style={{ color: "#717171" }}
        >
          {new Date(video.publishedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

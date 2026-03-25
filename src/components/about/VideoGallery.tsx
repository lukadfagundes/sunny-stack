"use client";

import { useState, useEffect } from "react";
import { Youtube } from "lucide-react";
import type { YouTubeVideo } from "@/app/api/youtube/route";
import VideoCard from "./VideoCard";

interface VideoGalleryProps {
  onBack: () => void;
}

export default function VideoGallery({ onBack }: VideoGalleryProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/youtube")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: YouTubeVideo[]) => {
        setVideos(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        fontFamily: "Roboto, Arial, sans-serif",
        background: "#0F0F0F",
        border: "1px solid #272727",
      }}
    >
      {/* YouTube-style header with gradient */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #FF0000, #CC0000)",
        }}
      >
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">
            Luka&apos;s Videos
          </span>
        </div>
        <button
          onClick={onBack}
          className="text-white/90 hover:text-white text-xs font-medium cursor-pointer bg-transparent border-none p-0"
          style={{ fontFamily: "inherit" }}
        >
          Back to Profile
        </button>
      </div>

      {/* Content area */}
      <div style={{ background: "#0F0F0F" }}>
        {/* Subheader */}
        <p
          className="text-xs px-4 py-3"
          style={{ color: "#AAAAAA", letterSpacing: "0.02em" }}
        >
          Videos from YouTube, newest first
        </p>

        {/* Loading skeletons */}
        {loading && (
          <div className="max-w-[600px] mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ borderBottom: "1px solid #272727" }}>
                <div
                  className="aspect-video animate-pulse"
                  style={{ background: "#272727" }}
                />
                <div className="px-3 py-3 space-y-2">
                  <div
                    className="h-4 w-48 animate-pulse rounded"
                    style={{ background: "#272727" }}
                  />
                  <div
                    className="h-3 w-32 animate-pulse rounded"
                    style={{ background: "#272727" }}
                  />
                  <div
                    className="h-3 w-64 animate-pulse rounded"
                    style={{ background: "#272727" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <Youtube
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#555555" }}
            />
            <p className="text-sm" style={{ color: "#AAAAAA" }}>
              Could not load videos. Please try again later.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-12">
            <Youtube
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#555555" }}
            />
            <p className="text-sm" style={{ color: "#AAAAAA" }}>
              No videos to display.
            </p>
          </div>
        )}

        {/* Vertical feed */}
        {!loading && !error && videos.length > 0 && (
          <div className="max-w-[600px] mx-auto">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

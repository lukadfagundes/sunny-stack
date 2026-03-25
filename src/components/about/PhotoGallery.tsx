"use client";

import { useState, useEffect } from "react";
import { Instagram } from "lucide-react";
import type { InstagramPost } from "@/app/api/instagram/route";
import PostCard from "./PostCard";

interface PhotoGalleryProps {
  onBack: () => void;
}

export default function PhotoGallery({ onBack }: PhotoGalleryProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/instagram")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: InstagramPost[]) => {
        setPosts(data);
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
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: "#000000",
        border: "1px solid #262626",
      }}
    >
      {/* Instagram-style header with gradient */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45)",
        }}
      >
        <div className="flex items-center gap-2">
          <Instagram className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">
            Luka&apos;s Pics
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
      <div style={{ background: "#000000" }}>
        {/* Subheader */}
        <p
          className="text-xs px-4 py-3"
          style={{ color: "#A8A8A8", letterSpacing: "0.02em" }}
        >
          Photos from Instagram, newest first
        </p>

        {/* Loading skeletons */}
        {loading && (
          <div className="max-w-[600px] mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ borderBottom: "1px solid #262626" }}>
                <div
                  className="aspect-square animate-pulse"
                  style={{ background: "#262626" }}
                />
                <div className="px-3 py-3 space-y-2">
                  <div
                    className="h-3 w-24 animate-pulse rounded"
                    style={{ background: "#262626" }}
                  />
                  <div
                    className="h-3 w-48 animate-pulse rounded"
                    style={{ background: "#262626" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <Instagram
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#555555" }}
            />
            <p className="text-sm" style={{ color: "#A8A8A8" }}>
              Could not load photos. Please try again later.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12">
            <Instagram
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#555555" }}
            />
            <p className="text-sm" style={{ color: "#A8A8A8" }}>
              No photos to display.
            </p>
          </div>
        )}

        {/* Vertical feed */}
        {!loading && !error && posts.length > 0 && (
          <div className="max-w-[600px] mx-auto">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Music } from "lucide-react";
import type { SpotifyTopTrack } from "@/app/api/spotify/top-track/route";

interface MusicPlayerProps {
  onViewMusic?: () => void;
}

export default function MusicPlayer({ onViewMusic }: MusicPlayerProps) {
  const [track, setTrack] = useState<SpotifyTopTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/top-track")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: SpotifyTopTrack | null) => {
        setTrack(data && data.id ? data : null);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: "1px solid #1DB954" }}
    >
      {/* Embed area — 80px */}
      <div style={{ height: 80, background: "#191414" }}>
        {/* Loading */}
        {loading && (
          <div className="px-3 py-3 space-y-2">
            <div
              className="h-4 w-3/4 animate-pulse rounded"
              style={{ background: "#282828" }}
            />
            <div
              className="h-[80px] w-full animate-pulse rounded"
              style={{ background: "#282828" }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-3 py-3 text-center">
            <Music
              className="w-5 h-5 mx-auto mb-1"
              style={{ color: "#535353" }}
            />
            <p className="text-xs" style={{ color: "#B3B3B3" }}>
              Could not load music.
            </p>
          </div>
        )}

        {/* No track available (env not configured) */}
        {!loading && !error && !track && (
          <div className="px-3 py-2 flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: "#1DB954" }} />
            <p className="text-xs" style={{ color: "#B3B3B3" }}>
              No track available
            </p>
          </div>
        )}

        {/* Spotify embed player */}
        {!loading && !error && track && (
          <iframe
            src={`https://open.spotify.com/embed/track/${track.id}?theme=0`}
            width="100%"
            height="80"
            allow="encrypted-media"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            title={`Play ${track.name} by ${track.artist}`}
            style={{ border: "none", display: "block" }}
          />
        )}
      </div>

      {/* Button area — 15px height, Spotify black */}
      {onViewMusic && (
        <button
          onClick={onViewMusic}
          className="w-full text-xs font-medium cursor-pointer border-none"
          style={{
            height: 28,
            lineHeight: "28px",
            background: "#191414",
            color: "#1DB954",
            fontFamily: "inherit",
            padding: 0,
          }}
        >
          Check out more music
        </button>
      )}
    </div>
  );
}

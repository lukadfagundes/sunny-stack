"use client";

import { useState, useEffect } from "react";
import { Music } from "lucide-react";
import Image from "next/image";
import type { SpotifyWrappedData } from "@/app/api/spotify/wrapped/route";

interface MusicGalleryProps {
  onBack: () => void;
}

export default function MusicGallery({ onBack }: MusicGalleryProps) {
  const [data, setData] = useState<SpotifyWrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/wrapped")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result: SpotifyWrappedData | null) => {
        setData(result && result.tracks ? result : null);
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
        background: "#191414",
        border: "1px solid #1DB954",
      }}
    >
      {/* Spotify-styled header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #1DB954, #1ed760)",
        }}
      >
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">
            Luka&apos;s Music
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
      <div style={{ background: "#191414" }}>
        {/* Loading skeletons */}
        {loading && (
          <div className="px-4 py-4 space-y-4">
            <div
              className="h-5 w-48 animate-pulse rounded"
              style={{ background: "#282828" }}
            />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-12 h-12 animate-pulse rounded"
                  style={{ background: "#282828" }}
                />
                <div className="flex-1 space-y-1">
                  <div
                    className="h-3 w-32 animate-pulse rounded"
                    style={{ background: "#282828" }}
                  />
                  <div
                    className="h-3 w-24 animate-pulse rounded"
                    style={{ background: "#282828" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <Music
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#535353" }}
            />
            <p className="text-sm" style={{ color: "#B3B3B3" }}>
              Could not load music data. Please try again later.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !data && (
          <div className="text-center py-12">
            <Music
              className="w-10 h-10 mx-auto mb-3"
              style={{ color: "#535353" }}
            />
            <p className="text-sm" style={{ color: "#B3B3B3" }}>
              No music data to display.
            </p>
          </div>
        )}

        {/* Wrapped data */}
        {!loading && !error && data && (
          <div className="px-4 py-4">
            {/* Wrapped header */}
            <p
              className="text-lg font-bold mb-4"
              style={{ color: "#FFFFFF" }}
            >
              Luka&apos;s Recent Favorites
            </p>

            {/* Top Tracks */}
            {data.tracks.length > 0 && (
              <div className="mb-6">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "#1DB954" }}
                >
                  Top Tracks
                </p>
                <div className="space-y-2">
                  {data.tracks.map((track, i) => (
                    <a
                      key={track.id}
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:opacity-80 transition-opacity"
                      style={{ background: "#282828" }}
                    >
                      <span
                        className="text-sm font-bold w-5 text-right flex-shrink-0"
                        style={{ color: "#B3B3B3" }}
                      >
                        {i + 1}
                      </span>
                      <div className="w-12 h-12 flex-shrink-0 relative rounded overflow-hidden">
                        <Image
                          src={track.albumImageUrl}
                          alt={track.albumName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "#FFFFFF" }}
                        >
                          {track.name}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "#B3B3B3" }}
                        >
                          {track.artist}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Top Artists */}
            {data.artists.length > 0 && (
              <div className="mb-6">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "#1DB954" }}
                >
                  Top Artists
                </p>
                <div className="space-y-2">
                  {data.artists.map((artist, i) => (
                    <a
                      key={artist.id}
                      href={artist.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:opacity-80 transition-opacity"
                      style={{ background: "#282828" }}
                    >
                      <span
                        className="text-sm font-bold w-5 text-right flex-shrink-0"
                        style={{ color: "#B3B3B3" }}
                      >
                        {i + 1}
                      </span>
                      <div className="w-12 h-12 flex-shrink-0 relative rounded-full overflow-hidden">
                        {artist.imageUrl ? (
                          <Image
                            src={artist.imageUrl}
                            alt={artist.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: "#535353" }}
                          >
                            <Music
                              className="w-5 h-5"
                              style={{ color: "#B3B3B3" }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "#FFFFFF" }}
                        >
                          {artist.name}
                        </p>
                        {artist.genres.length > 0 && (
                          <p
                            className="text-xs truncate"
                            style={{ color: "#B3B3B3" }}
                          >
                            {artist.genres.join(", ")}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Top Genres */}
            {data.topGenres.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "#1DB954" }}
                >
                  Top Genres
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.topGenres.map((genre) => (
                    <span
                      key={genre}
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{
                        background: "#1DB954",
                        color: "#191414",
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { interests } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";
import type { SpotifyWrappedData } from "@/app/api/spotify/wrapped/route";

const badgeColors: Record<string, string> = {
  General: "#E67E22",
  Music: "#1DB954",
  Movies: "#E74C3C",
  Television: "#9B59B6",
  Books: "#3498DB",
  Heroes: "#F97316",
};

export default function InterestsTable() {
  const [genres, setGenres] = useState<string[]>([]);
  const [genresError, setGenresError] = useState(false);

  useEffect(() => {
    fetch("/api/spotify/wrapped")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: SpotifyWrappedData | null) => {
        if (data?.topGenres?.length) {
          setGenres(data.topGenres);
        } else {
          setGenresError(true);
        }
      })
      .catch(() => {
        setGenresError(true);
      });
  }, []);

  function renderBadges(items: string[], bg: string) {
    return (
      <span className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: bg, color: "#FFF" }}
          >
            {item}
          </span>
        ))}
      </span>
    );
  }

  function renderValue(label: string, value: string) {
    const bg = badgeColors[label];
    if (!bg) return value;

    if (label === "Music") {
      if (genres.length > 0) return renderBadges(genres, bg);
      if (genresError) {
        return (
          <span className="text-sunny-cream-muted italic text-xs">
            Unable to load Spotify data
          </span>
        );
      }
      return (
        <span className="text-sunny-cream-muted italic text-xs">
          Loading...
        </span>
      );
    }

    const items = value.split(", ").filter(Boolean);
    if (items.length > 0 && items[0] !== "Placeholder") {
      return renderBadges(items, bg);
    }

    return value;
  }

  return (
    <div>
      <SectionHeader title="Interests" />
      <div className="rounded-b-md overflow-hidden border-x border-b border-sunny-surface-light">
        {interests.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] items-center text-sm ${
              i < interests.length - 1
                ? "border-b border-sunny-surface-light"
                : ""
            }`}
            style={{
              backgroundColor: i % 2 === 0 ? "#2A1F14" : "#1A1209",
            }}
          >
            <span
              className="text-sunny-gold font-medium px-4 py-3"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              {row.label}
            </span>
            <span
              className="text-sunny-cream px-4 py-3"
              style={{ fontFamily: "Verdana, sans-serif" }}
            >
              {renderValue(row.label, row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

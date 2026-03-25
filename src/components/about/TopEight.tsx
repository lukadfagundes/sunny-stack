"use client";

import { useState, useEffect } from "react";
import { profile } from "@/lib/data/personal";
import type { SteamGamesData, SteamGame } from "@/app/api/steam/route";

interface TopEightProps {
  onViewGame?: (game: SteamGame) => void;
}

export default function TopEight({ onViewGame }: TopEightProps) {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/steam")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: SteamGamesData | null) => {
        if (data?.games?.length) {
          setGames(data.games);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Steam-styled header */}
      <div
        className="px-3 py-2 flex items-center gap-2 rounded-t-md"
        style={{
          background: "linear-gradient(to right, #2a475e, #1b2838)",
          borderBottom: "1px solid #66c0f4",
        }}
      >
        <span
          className="font-bold text-sm"
          style={{ color: "#c7d5e0", fontFamily: "Verdana, sans-serif" }}
        >
          {profile.name}&apos;s Top 8 Games
        </span>
      </div>

      {/* Main content */}
      <div
        className="rounded-b-md px-4 py-3"
        style={{ backgroundColor: "#1b2838" }}
      >
        {loading && (
          <p
            className="text-sm italic"
            style={{ color: "#8f98a0" }}
          >
            Loading...
          </p>
        )}

        {error && (
          <p
            className="text-sm italic"
            style={{ color: "#8f98a0" }}
          >
            Unable to load Steam data
          </p>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {games.map((game) => (
              <button
                key={game.appid}
                onClick={() => onViewGame?.(game)}
                className="text-left rounded transition-colors"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#2a475e";
                  e.currentTarget.style.borderColor = "#66c0f4";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={game.headerImage}
                  alt={game.name}
                  className="w-full h-auto rounded-t"
                />
                <div className="px-2 py-1.5">
                  <span
                    className="text-xs font-medium block truncate"
                    style={{ color: "#c7d5e0" }}
                  >
                    {game.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

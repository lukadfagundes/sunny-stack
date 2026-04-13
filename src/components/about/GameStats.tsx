"use client";

import { useState, useEffect } from "react";
import type { SteamGame } from "@/app/api/steam/route";
import type { SteamAchievementData } from "@/app/api/steam/achievements/route";

interface GameStatsProps {
  game: SteamGame;
  onBack: () => void;
}

function formatPlaytime(minutes: number): string {
  const hours = minutes / 60;
  if (hours < 1) return `${minutes}m`;
  return `${hours.toFixed(1)} hrs`;
}

function formatUnlockDate(timestamp: number): string {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function GameStats({ game, onBack }: GameStatsProps) {
  const [achievements, setAchievements] = useState<SteamAchievementData | null>(
    null,
  );
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/steam/achievements?appid=${game.appid}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: SteamAchievementData | null) => {
        setAchievements(data);
        setAchievementsLoading(false);
      })
      .catch(() => {
        setAchievementsLoading(false);
      });
  }, [game.appid]);

  const achievementPercent =
    achievements && achievements.total > 0
      ? Math.round((achievements.achieved / achievements.total) * 100)
      : 0;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        fontFamily: "Verdana, sans-serif",
        background: "#1b2838",
        border: "1px solid #2a475e",
      }}
    >
      {/* Steam-styled header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: "linear-gradient(to right, #2a475e, #1b2838)",
          borderBottom: "1px solid #66c0f4",
        }}
      >
        <span className="font-bold text-sm" style={{ color: "#c7d5e0" }}>
          {game.name}
        </span>
        <button
          onClick={onBack}
          className="text-xs font-medium cursor-pointer bg-transparent border-none p-0"
          style={{ color: "#66c0f4", fontFamily: "inherit" }}
        >
          Back to Profile
        </button>
      </div>

      {/* Hero banner */}
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={game.headerImage} alt={game.name} className="w-full h-auto" />
      </div>

      {/* Stats content */}
      <div className="p-5 space-y-5">
        {/* Status */}
        <div className="rounded p-4" style={{ backgroundColor: "#2a475e" }}>
          <span
            className="text-xs uppercase tracking-wide block mb-1"
            style={{ color: "#8f98a0" }}
          >
            Status
          </span>
          {game.recentlyPlayed ? (
            <span className="text-sm font-medium" style={{ color: "#5ba32b" }}>
              Played recently
            </span>
          ) : (
            <span className="text-sm" style={{ color: "#8f98a0" }}>
              Not played recently
            </span>
          )}
        </div>

        {/* Playtime */}
        <div className="rounded p-4" style={{ backgroundColor: "#2a475e" }}>
          <span
            className="text-xs uppercase tracking-wide block mb-1"
            style={{ color: "#8f98a0" }}
          >
            Total Playtime
          </span>
          <span className="text-lg font-bold" style={{ color: "#66c0f4" }}>
            {formatPlaytime(game.playtimeMinutes)}
          </span>
        </div>

        {/* Achievements */}
        <div className="rounded p-4" style={{ backgroundColor: "#2a475e" }}>
          <span
            className="text-xs uppercase tracking-wide block mb-2"
            style={{ color: "#8f98a0" }}
          >
            Achievements
          </span>
          {achievementsLoading ? (
            <span className="text-xs italic" style={{ color: "#8f98a0" }}>
              Loading...
            </span>
          ) : achievements ? (
            <div>
              {/* Progress summary */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-sm font-bold"
                  style={{ color: "#c7d5e0" }}
                >
                  {achievements.achieved} / {achievements.total}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#66c0f4" }}
                >
                  {achievementPercent}%
                </span>
              </div>
              <div
                className="w-full h-3 rounded-full overflow-hidden mb-4"
                style={{ backgroundColor: "#1b2838" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${achievementPercent}%`,
                    backgroundColor: "#5ba32b",
                  }}
                  role="progressbar"
                  aria-valuenow={achievements.achieved}
                  aria-valuemin={0}
                  aria-valuemax={achievements.total}
                />
              </div>

              {/* Earned achievements grid */}
              {achievements.achievements.length > 0 && (
                <div>
                  <span
                    className="text-xs uppercase tracking-wide block mb-2"
                    style={{ color: "#8f98a0" }}
                  >
                    Earned
                  </span>
                  <div
                    className="overflow-y-auto steam-scrollbar"
                    style={{ maxHeight: "312px" }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {achievements.achievements.map((ach) => (
                        <div
                          key={ach.apiname}
                          className="flex items-center gap-3 rounded p-2"
                          style={{ backgroundColor: "#1b2838" }}
                        >
                          {ach.icon && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ach.icon}
                              alt={ach.displayName}
                              className="w-10 h-10 rounded flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <span
                              className="text-xs font-bold block truncate"
                              style={{ color: "#c7d5e0" }}
                            >
                              {ach.displayName}
                            </span>
                            {ach.description && (
                              <span
                                className="text-xs block truncate"
                                style={{ color: "#8f98a0" }}
                              >
                                {ach.description}
                              </span>
                            )}
                            {ach.unlocktime > 0 && (
                              <span
                                className="text-xs"
                                style={{ color: "#5ba32b" }}
                              >
                                Unlocked {formatUnlockDate(ach.unlocktime)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs italic" style={{ color: "#8f98a0" }}>
              No achievements
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

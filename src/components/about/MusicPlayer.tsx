"use client";

import { Pause, Volume2, Plus } from "lucide-react";
import { musicPlayer } from "@/lib/data/personal";

export default function MusicPlayer() {
  return (
    <div
      className="bg-sunny-surface rounded-md overflow-hidden"
      style={{ border: "1px solid #3D2E1F" }}
    >
      {/* Player bar — mimics the MySpace embedded player */}
      <div className="px-3 py-2 flex items-center gap-2">
        <button
          className="text-sunny-cream-muted hover:text-sunny-cream transition-colors flex-shrink-0"
          aria-label="Pause"
          tabIndex={-1}
        >
          <Pause className="w-4 h-4" />
        </button>

        {/* Track info + progress */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-sunny-cream-muted truncate mb-1">
            {musicPlayer.trackName} — {musicPlayer.artist}
          </p>
          {/* Loading / progress bar */}
          <div className="w-full h-1.5 bg-sunny-bg rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm"
              style={{
                width: "35%",
                background:
                  "linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)",
              }}
            />
          </div>
        </div>

        {/* Volume + add */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            className="text-sunny-cream-muted hover:text-sunny-cream transition-colors"
            aria-label="Volume"
            tabIndex={-1}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="text-sunny-cream-muted hover:text-sunny-cream transition-colors"
            aria-label="Add song to your profile"
            tabIndex={-1}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-sunny-cream-muted px-3 pb-2 italic">
        Add song to your profile...
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import ProfileCard from "@/components/about/ProfileCard";
import ContactTable from "@/components/about/ContactTable";
import MusicPlayer from "@/components/about/MusicPlayer";
import DetailsBox from "@/components/about/DetailsBox";
import NetworkBanner from "@/components/about/NetworkBanner";
import BlogEntry from "@/components/about/BlogEntry";
import BioSections from "@/components/about/BioSections";
import InterestsTable from "@/components/about/InterestsTable";
import TopEight from "@/components/about/TopEight";
import PhotoGallery from "@/components/about/PhotoGallery";
import VideoGallery from "@/components/about/VideoGallery";
import MusicGallery from "@/components/about/MusicGallery";
import GameStats from "@/components/about/GameStats";
import type { SteamGame } from "@/app/api/steam/route";

type AboutView = "profile" | "pics" | "videos" | "music" | "game";

export default function AboutPage() {
  const [view, setView] = useState<AboutView>("profile");
  const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);

  return (
    <main
      className="flex-1 min-h-screen relative z-10"
      style={{ fontFamily: "Verdana, sans-serif" }}
    >
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Two-column MySpace layout */}
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
            {/* ── Left Column (Profile Identity) ── */}
            {/* Exact MySpace order: Profile → Contacting → URL → Music → Details */}
            <div className="space-y-4">
              <ProfileCard
                onViewPics={() => setView("pics")}
                onViewVideos={() => setView("videos")}
              />
              <ContactTable />
              <MusicPlayer onViewMusic={() => setView("music")} />
              <DetailsBox />
            </div>

            {/* ── Right Column (Content Sections) ── */}
            <div className="space-y-5">
              {view === "profile" ? (
                <>
                  {/* Exact MySpace order: Network → Blog → Blurbs → Interests → Game Space */}
                  <NetworkBanner />
                  <BlogEntry />
                  <BioSections />
                  <InterestsTable />
                  <TopEight onViewGame={(game) => { setSelectedGame(game); setView("game"); }} />
                </>
              ) : view === "pics" ? (
                <PhotoGallery onBack={() => setView("profile")} />
              ) : view === "videos" ? (
                <VideoGallery onBack={() => setView("profile")} />
              ) : view === "music" ? (
                <MusicGallery onBack={() => setView("profile")} />
              ) : selectedGame ? (
                <GameStats game={selectedGame} onBack={() => setView("profile")} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

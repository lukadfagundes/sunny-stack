"use client";

import { useState } from "react";
import ProfileCard from "@/components/about/ProfileCard";
import ContactTable from "@/components/about/ContactTable";
import MySpaceUrl from "@/components/about/MySpaceUrl";
import MusicPlayer from "@/components/about/MusicPlayer";
import DetailsBox from "@/components/about/DetailsBox";
import NetworkBanner from "@/components/about/NetworkBanner";
import BlogEntry from "@/components/about/BlogEntry";
import BioSections from "@/components/about/BioSections";
import InterestsTable from "@/components/about/InterestsTable";
import TopEight from "@/components/about/TopEight";
import CommentsWall from "@/components/about/CommentsWall";
import PhotoGallery from "@/components/about/PhotoGallery";
import VideoGallery from "@/components/about/VideoGallery";
import MusicGallery from "@/components/about/MusicGallery";

type AboutView = "profile" | "pics" | "videos" | "music";

export default function AboutPage() {
  const [view, setView] = useState<AboutView>("profile");

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
              <MySpaceUrl />
              <MusicPlayer onViewMusic={() => setView("music")} />
              <DetailsBox />
            </div>

            {/* ── Right Column (Content Sections) ── */}
            <div className="space-y-5">
              {view === "profile" ? (
                <>
                  {/* Exact MySpace order: Network → Blog → Blurbs → Interests → Friend Space → Comments */}
                  <NetworkBanner />
                  <BlogEntry />
                  <BioSections />
                  <InterestsTable />
                  <TopEight />
                  <CommentsWall />
                </>
              ) : view === "pics" ? (
                <PhotoGallery onBack={() => setView("profile")} />
              ) : view === "videos" ? (
                <VideoGallery onBack={() => setView("profile")} />
              ) : (
                <MusicGallery onBack={() => setView("profile")} />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

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

export default function AboutPage() {
  return (
    <main
      className="flex-1 min-h-screen"
      style={{ fontFamily: "Verdana, sans-serif" }}
    >
      {/* ── Horizon background (same gradient as landing page) ── */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, #1A1209 0%, #2A1F14 30%, #3D2E1F 55%, #6B4226 75%, #B8860B 95%)",
        }}
      >
        {/* Horizon glow line */}
        <div className="absolute w-full" style={{ top: "70%" }}>
          <div
            className="w-full h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 5%, #F0B429 30%, #F0B429 70%, transparent 95%)",
              boxShadow: "0 0 20px 2px rgba(240, 180, 41, 0.3)",
            }}
          />
          <div
            className="w-full h-8 -mt-4"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(240, 180, 41, 0.15) 0%, transparent 70%)",
            }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Two-column MySpace layout */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            {/* ── Left Column (Profile Identity) ── */}
            {/* Exact MySpace order: Profile → Contacting → URL → Music → Details */}
            <div className="space-y-4">
              <ProfileCard />
              <ContactTable />
              <MySpaceUrl />
              <MusicPlayer />
              <DetailsBox />
            </div>

            {/* ── Right Column (Content Sections) ── */}
            {/* Exact MySpace order: Network → Blog → Blurbs → Interests → Friend Space → Comments */}
            <div className="space-y-5">
              <NetworkBanner />
              <BlogEntry />
              <BioSections />
              <InterestsTable />
              <TopEight />
              <CommentsWall />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

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
      className="flex-1 min-h-screen relative z-10"
      style={{ fontFamily: "Verdana, sans-serif" }}
    >
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

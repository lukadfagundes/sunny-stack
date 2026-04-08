import type { Metadata } from "next";
import { fetchGitHubData } from "@/lib/github";
import HeroSection from "@/components/HeroSection";
import ContributionHeatmap from "@/components/landing/ContributionHeatmap";
import StatsDashboard from "@/components/landing/StatsDashboard";
import TechArsenal from "@/components/landing/TechArsenal";
import CurrentlyBuilding from "@/components/landing/CurrentlyBuilding";

export const metadata: Metadata = {};

export const revalidate = 3600; // ISR: revalidate every hour

export default async function Home() {
  const data = await fetchGitHubData();

  return (
    <main className="flex-1 relative z-10">
        <HeroSection />

        {/* ── The Ship's Deck — unified panel ── */}
        <section className="px-4 sm:px-6 pb-16">
          <div
            className="max-w-6xl mx-auto relative overflow-hidden"
            style={{
              borderRadius: 20,
              border: "1px solid rgba(184, 134, 11, 0.2)",
            }}
          >
            {/* Deck background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 40% 30%, rgba(52, 38, 24, 0.95) 0%, rgba(30, 22, 13, 0.98) 50%, rgba(20, 14, 8, 0.99) 100%)",
              }}
            />

            {/* Faint map grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(184, 134, 11, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(184, 134, 11, 1) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />

            {/* Burnt edge vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 0 80px 30px rgba(10, 6, 3, 0.5), inset 0 0 160px 60px rgba(10, 6, 3, 0.2)",
              }}
            />

            {/* Corner rivets */}
            {[
              { top: 14, left: 14 },
              { top: 14, right: 14 },
              { bottom: 14, left: 14 },
              { bottom: 14, right: 14 },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute z-10"
                style={{
                  ...pos,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(240, 180, 41, 0.4), rgba(107, 66, 38, 0.6))",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
                }}
              />
            ))}

            {/* ── Content zones ── */}
            <div className="relative">
              {/* Zone 1: Captain's Chart — full width */}
              <div className="p-5 sm:p-7">
                <ContributionHeatmap calendar={data.contributionCalendar} />
              </div>

              {/* Horizontal divider */}
              <div
                className="mx-6 sm:mx-8"
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(184, 134, 11, 0.2) 20%, rgba(184, 134, 11, 0.2) 80%, transparent)",
                }}
              />

              {/* Zone 2: Instruments — full width, gauges spread out */}
              <div className="p-5 sm:p-7">
                <StatsDashboard
                  totalCommits={data.totalCommits}
                  totalPRs={data.totalPRs}
                  totalIssues={data.totalIssues}
                  totalRepos={data.totalPublicRepos}
                  totalStars={data.totalStars}
                  totalContributions={data.contributionCalendar.totalContributions}
                />
              </div>

              {/* Horizontal divider */}
              <div
                className="mx-6 sm:mx-8"
                style={{
                  height: 1,
                  background:
                    "linear-gradient(90deg, transparent, rgba(184, 134, 11, 0.2) 20%, rgba(184, 134, 11, 0.2) 80%, transparent)",
                }}
              />

              {/* Zone 3: Cargo Hold (left) + Spyglass (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-[auto_auto_1fr] gap-0 items-start">
                {/* Cargo Hold zone */}
                <div className="p-5 sm:p-7">
                  <TechArsenal />
                </div>

                {/* Vertical divider */}
                <div
                  className="hidden lg:block self-stretch my-6"
                  style={{
                    width: 1,
                    background:
                      "linear-gradient(180deg, transparent, rgba(184, 134, 11, 0.2) 20%, rgba(184, 134, 11, 0.2) 80%, transparent)",
                  }}
                />

                {/* Spyglass zone */}
                <div className="p-5 sm:p-7">
                  <CurrentlyBuilding repos={data.publicRepos} />
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}

import { fetchGitHubData } from "@/lib/github";
import HeroSection from "@/components/HeroSection";
import ContributionHeatmap from "@/components/landing/ContributionHeatmap";
import StatsDashboard from "@/components/landing/StatsDashboard";
import TechArsenal from "@/components/landing/TechArsenal";
import CurrentlyBuilding from "@/components/landing/CurrentlyBuilding";
import VoyageSail from "@/components/landing/VoyageSail";

export const revalidate = 3600; // ISR: revalidate every hour

export default async function Home() {
  const data = await fetchGitHubData();

  return (
    <main className="flex-1">
      {/* Fixed background with sailing ship */}
      <VoyageSail>
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
      </VoyageSail>

      {/* Scrollable content over the fixed background */}
      <div className="relative z-10">
        <HeroSection />
        <ContributionHeatmap calendar={data.contributionCalendar} />
        <StatsDashboard
          totalCommits={data.totalCommits}
          totalPRs={data.totalPRs}
          totalIssues={data.totalIssues}
          totalRepos={data.totalPublicRepos}
          totalStars={data.totalStars}
          totalContributions={data.contributionCalendar.totalContributions}
        />
        <TechArsenal />
        <CurrentlyBuilding repos={data.publicRepos} />
      </div>
    </main>
  );
}

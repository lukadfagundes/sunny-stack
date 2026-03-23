import { NextResponse } from "next/server";

export interface OverwatchHeroData {
  heroes: { name: string; timePlayed: number }[];
}

interface HeroStats {
  time_played: number;
  games_played: number;
  games_won: number;
  winrate: number;
}

function formatHeroName(key: string): string {
  return key
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET() {
  const battletag = process.env.OVERWATCH_BATTLETAG;

  if (!battletag) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const playerId = battletag.replace("#", "-");
    const url = `https://overfast-api.tekrop.fr/players/${encodeURIComponent(playerId)}/stats/summary`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("Overwatch API error:", response.status);
      return NextResponse.json(null, { status: 200 });
    }

    const data = await response.json();
    const heroesObj: Record<string, HeroStats> = data.heroes ?? {};

    const sorted = Object.entries(heroesObj)
      .sort(([, a], [, b]) => b.time_played - a.time_played)
      .slice(0, 5)
      .map(([key, stats]) => ({
        name: formatHeroName(key),
        timePlayed: stats.time_played,
      }));

    const result: OverwatchHeroData = { heroes: sorted };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Overwatch fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

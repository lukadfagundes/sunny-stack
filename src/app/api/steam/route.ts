import { NextResponse } from "next/server";

export interface SteamGame {
  appid: number;
  name: string;
  playtimeMinutes: number;
  headerImage: string;
  recentlyPlayed: boolean;
}

export interface SteamGamesData {
  games: SteamGame[];
}

interface SteamApiGame {
  appid: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
}

export async function GET() {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("Steam API error:", response.status);
      return NextResponse.json(null, { status: 200 });
    }

    const data = await response.json();
    const games: SteamApiGame[] = data?.response?.games ?? [];

    // Filter out non-game apps (tools, utilities, etc.)
    const EXCLUDED_APPIDS = new Set([431960]); // Wallpaper Engine

    const top8 = games
      .filter((g) => !EXCLUDED_APPIDS.has(g.appid))
      .sort((a, b) => (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0))
      .slice(0, 8);

    // Fetch header images from Steam store API (parallel)
    const headerImages = await Promise.all(
      top8.map(async (game) => {
        try {
          const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${game.appid}&filters=basic`;
          const res = await fetch(detailsUrl, { cache: "no-store" });
          if (!res.ok) return "";
          const details = await res.json();
          return details?.[String(game.appid)]?.data?.header_image ?? "";
        } catch {
          return "";
        }
      }),
    );

    const sorted = top8.map((game, i) => ({
      appid: game.appid,
      name: game.name ?? `App ${game.appid}`,
      playtimeMinutes: game.playtime_forever ?? 0,
      headerImage: headerImages[i],
      recentlyPlayed: (game.playtime_2weeks ?? 0) > 0,
    }));

    const result: SteamGamesData = { games: sorted };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Steam fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

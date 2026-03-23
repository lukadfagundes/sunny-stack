import { NextRequest, NextResponse } from "next/server";

export interface SteamEarnedAchievement {
  apiname: string;
  displayName: string;
  description: string;
  icon: string;
  unlocktime: number;
}

export interface SteamAchievementData {
  achieved: number;
  total: number;
  achievements: SteamEarnedAchievement[];
}

interface PlayerAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
}

interface SchemaAchievement {
  name: string;
  displayName: string;
  description?: string;
  icon: string;
  icongray: string;
  hidden: number;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    return NextResponse.json(null, { status: 200 });
  }

  const appid = request.nextUrl.searchParams.get("appid");
  if (!appid) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const playerUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&steamid=${steamId}&appid=${appid}`;
    const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appid}`;

    const [playerRes, schemaRes] = await Promise.all([
      fetch(playerUrl, { cache: "no-store" }),
      fetch(schemaUrl, { cache: "no-store" }),
    ]);

    if (!playerRes.ok) {
      return NextResponse.json(null, { status: 200 });
    }

    const playerData = await playerRes.json();

    if (playerData?.playerstats?.success === false) {
      return NextResponse.json(null, { status: 200 });
    }

    const playerAchievements: PlayerAchievement[] =
      playerData?.playerstats?.achievements ?? [];

    if (playerAchievements.length === 0) {
      return NextResponse.json(null, { status: 200 });
    }

    // Build schema lookup for display names and icons
    const schemaMap = new Map<string, SchemaAchievement>();
    if (schemaRes.ok) {
      const schemaData = await schemaRes.json();
      const schemaList: SchemaAchievement[] =
        schemaData?.game?.availableGameStats?.achievements ?? [];
      for (const s of schemaList) {
        schemaMap.set(s.name, s);
      }
    }

    const earned = playerAchievements
      .filter((a) => a.achieved === 1)
      .sort((a, b) => b.unlocktime - a.unlocktime)
      .map((a) => {
        const schema = schemaMap.get(a.apiname);
        return {
          apiname: a.apiname,
          displayName: schema?.displayName ?? a.apiname,
          description: schema?.description ?? "",
          icon: schema?.icon ?? "",
          unlocktime: a.unlocktime,
        };
      });

    const result: SteamAchievementData = {
      achieved: earned.length,
      total: playerAchievements.length,
      achievements: earned,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(null, { status: 200 });
  }
}

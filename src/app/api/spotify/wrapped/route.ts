import { NextResponse } from "next/server";
import { getSpotifyAccessToken, hasSpotifyCredentials } from "../token";

export interface SpotifyWrappedTrack {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumImageUrl: string;
  spotifyUrl: string;
}

export interface SpotifyWrappedArtist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  spotifyUrl: string;
}

export interface SpotifyWrappedData {
  tracks: SpotifyWrappedTrack[];
  artists: SpotifyWrappedArtist[];
  topGenres: string[];
  year: number;
}

interface SpotifyAPITrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  external_urls: { spotify: string };
}

interface SpotifyAPIArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  genres: string[];
  external_urls: { spotify: string };
}

let cache: { data: SpotifyWrappedData | null; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  if (!hasSpotifyCredentials()) {
    return NextResponse.json(null, { status: 200 });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      return NextResponse.json(null, { status: 200 });
    }

    const headers = { Authorization: `Bearer ${accessToken}` };
    const fetchOptions = { headers, next: { revalidate: 300 } as const };

    const [tracksRes, artistsRes] = await Promise.all([
      fetch(
        "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5",
        fetchOptions
      ),
      fetch(
        "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5",
        fetchOptions
      ),
    ]);

    if (!tracksRes.ok || !artistsRes.ok) {
      console.error(
        "Spotify wrapped API error:",
        !tracksRes.ok ? await tracksRes.text() : await artistsRes.text()
      );
      return NextResponse.json(null, { status: 200 });
    }

    const [tracksData, artistsData] = await Promise.all([
      tracksRes.json(),
      artistsRes.json(),
    ]);

    const tracks: SpotifyWrappedTrack[] = (
      (tracksData.items ?? []) as SpotifyAPITrack[]
    ).map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      albumName: t.album.name,
      albumImageUrl: t.album.images[0]?.url ?? "",
      spotifyUrl: t.external_urls.spotify,
    }));

    const artists: SpotifyWrappedArtist[] = (
      (artistsData.items ?? []) as SpotifyAPIArtist[]
    ).map((a) => ({
      id: a.id,
      name: a.name,
      imageUrl: a.images[0]?.url ?? "",
      genres: a.genres,
      spotifyUrl: a.external_urls.spotify,
    }));

    // Aggregate genres by frequency
    const genreCount: Record<string, number> = {};
    for (const artist of artists) {
      for (const genre of artist.genres) {
        genreCount[genre] = (genreCount[genre] ?? 0) + 1;
      }
    }
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre]) => genre);

    const result: SpotifyWrappedData = {
      tracks,
      artists,
      topGenres,
      year: new Date().getFullYear(),
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Spotify wrapped fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

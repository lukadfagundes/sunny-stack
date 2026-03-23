import { NextResponse } from "next/server";
import { getSpotifyAccessToken, hasSpotifyCredentials } from "../token";

export interface SpotifyTopTrack {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumImageUrl: string;
  spotifyUrl: string;
}

interface SpotifyArtist {
  name: string;
}

interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    name: string;
    images: SpotifyImage[];
  };
  external_urls: {
    spotify: string;
  };
}

let cache: { data: SpotifyTopTrack | null; timestamp: number } | null = null;
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

    const response = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=1",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error("Spotify top tracks API error:", await response.text());
      return NextResponse.json(null, { status: 200 });
    }

    const data = await response.json();
    const items: SpotifyTrackItem[] = data.items ?? [];

    if (items.length === 0) {
      cache = { data: null, timestamp: Date.now() };
      return NextResponse.json(null, { status: 200 });
    }

    const track = items[0];
    const result: SpotifyTopTrack = {
      id: track.id,
      name: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      albumName: track.album.name,
      albumImageUrl: track.album.images[0]?.url ?? "",
      spotifyUrl: track.external_urls.spotify,
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Spotify top track fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

import { NextResponse } from "next/server";

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  timestamp: string;
  permalink: string;
  likeCount: number;
  commentsCount: number;
}

interface InstagramAPIMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  caption?: string;
  timestamp: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramAPIResponse {
  data: InstagramAPIMedia[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

let cache: { data: InstagramPost[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json([], { status: 200 });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const fields = "id,media_type,media_url,caption,timestamp,permalink,like_count,comments_count";
    const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${token}&limit=50`;

    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) {
      const error = await response.text();
      console.error("Instagram API error:", error);
      return NextResponse.json([], { status: 200 });
    }

    const json: InstagramAPIResponse = await response.json();

    const posts: InstagramPost[] = json.data
      .filter((item) => item.media_type === "IMAGE")
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        imageUrl: item.media_url,
        caption: item.caption ?? "",
        timestamp: item.timestamp,
        permalink: item.permalink,
        likeCount: item.like_count ?? 0,
        commentsCount: item.comments_count ?? 0,
      }));

    cache = { data: posts, timestamp: Date.now() };

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Instagram fetch error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

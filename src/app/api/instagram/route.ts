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

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    const fields = "id,media_type,media_url,caption,timestamp,permalink,like_count,comments_count";
    const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${token}&limit=50`;

    const response = await fetch(url, { cache: "no-store" });

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

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Instagram fetch error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

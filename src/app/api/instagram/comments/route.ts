import { NextRequest, NextResponse } from "next/server";

export interface InstagramCommentReply {
  id: string;
  text: string;
  username: string;
  likeCount: number;
  timestamp: string;
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  likeCount: number;
  timestamp: string;
  replies: InstagramCommentReply[];
}

interface APICommentReply {
  id: string;
  text: string;
  username: string;
  like_count: number;
  timestamp: string;
}

interface APIComment {
  id: string;
  text: string;
  username: string;
  like_count: number;
  timestamp: string;
  replies?: { data: APICommentReply[] };
}

const commentCache = new Map<
  string,
  { data: InstagramComment[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");

  if (!postId) {
    return NextResponse.json([], { status: 200 });
  }

  if (!/^\d+(_\d+)?$/.test(postId)) {
    return NextResponse.json([], { status: 200 });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json([], { status: 200 });
  }

  const cached = commentCache.get(postId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const fields =
      "text,username,like_count,timestamp,replies{text,username,like_count,timestamp}";
    const url = `https://graph.instagram.com/${postId}/comments?fields=${fields}`;

    const response = await fetch(url, { next: { revalidate: 300 }, headers: { Authorization: `Bearer ${token}` } });

    if (!response.ok) {
      console.error(
        "Instagram comments API error:",
        await response.text()
      );
      return NextResponse.json([], { status: 200 });
    }

    const json = await response.json();
    const comments: InstagramComment[] = (json.data ?? []).map(
      (c: APIComment) => ({
        id: c.id,
        text: c.text,
        username: c.username,
        likeCount: c.like_count ?? 0,
        timestamp: c.timestamp,
        replies: (c.replies?.data ?? []).map((r) => ({
          id: r.id,
          text: r.text,
          username: r.username,
          likeCount: r.like_count ?? 0,
          timestamp: r.timestamp,
        })),
      })
    );

    if (commentCache.size >= MAX_CACHE_SIZE) {
      const oldest = commentCache.keys().next().value;
      if (oldest) commentCache.delete(oldest);
    }
    commentCache.set(postId, { data: comments, timestamp: Date.now() });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Instagram comments fetch error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

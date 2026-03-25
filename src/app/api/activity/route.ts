import { NextResponse } from "next/server";

export interface ActivityStatus {
  lastActivityAt: string | null;
  isOnline: boolean;
}

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const GITHUB_USERNAME = "strawhatluka";

const GITHUB_QUERY = `
query LastPush($username: String!) {
  user(login: $username) {
    repositories(first: 1, orderBy: { field: PUSHED_AT, direction: DESC }) {
      nodes { pushedAt }
    }
  }
}
`;

const ONLINE_THRESHOLD = 60 * 60 * 1000; // 1 hour

async function getGitHubLastActivity(): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GITHUB_QUERY,
        variables: { username: GITHUB_USERNAME },
      }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;
    return json.data?.user?.repositories?.nodes?.[0]?.pushedAt ?? null;
  } catch {
    return null;
  }
}

async function getBlueskyLastActivity(): Promise<string | null> {
  const handle = process.env.BLUESKY_HANDLE;
  if (!handle) return null;

  try {
    const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=1&filter=posts_no_replies`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.feed?.[0]?.post?.record?.createdAt ?? null;
  } catch {
    return null;
  }
}

async function getInstagramLastActivity(): Promise<string | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const url = `https://graph.instagram.com/me/media?fields=timestamp&access_token=${token}&limit=1`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.timestamp ?? null;
  } catch {
    return null;
  }
}

async function getYouTubeLastActivity(): Promise<string | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return null;

  try {
    // Get uploads playlist
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
    const channelRes = await fetch(channelUrl, { cache: "no-store" });
    if (!channelRes.ok) return null;

    const channelData = await channelRes.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) return null;

    // Get most recent video
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=1&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl, { cache: "no-store" });
    if (!playlistRes.ok) return null;

    const playlistData = await playlistRes.json();
    return playlistData.items?.[0]?.snippet?.publishedAt ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Fetch all platform timestamps in parallel
    const [github, bluesky, instagram, youtube] = await Promise.all([
      getGitHubLastActivity(),
      getBlueskyLastActivity(),
      getInstagramLastActivity(),
      getYouTubeLastActivity(),
    ]);

    // Collect all valid timestamps
    const timestamps = [github, bluesky, instagram, youtube]
      .filter((t): t is string => t !== null)
      .map((t) => new Date(t).getTime())
      .filter((t) => !isNaN(t));

    if (timestamps.length === 0) {
      return NextResponse.json({ lastActivityAt: null, isOnline: false });
    }

    const mostRecent = Math.max(...timestamps);
    const isOnline = Date.now() - mostRecent < ONLINE_THRESHOLD;

    const result: ActivityStatus = {
      lastActivityAt: new Date(mostRecent).toISOString(),
      isOnline,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[activity] Fetch failed:", error);
    const result: ActivityStatus = { lastActivityAt: null, isOnline: false };
    return NextResponse.json(result);
  }
}

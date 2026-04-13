import { NextResponse } from "next/server";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

interface PlaylistItemSnippet {
  resourceId: { videoId: string };
  title: string;
  description: string;
  thumbnails: {
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
  publishedAt: string;
}

interface PlaylistItem {
  snippet: PlaylistItemSnippet;
}

interface VideoStatistics {
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

interface VideoItem {
  id: string;
  statistics: VideoStatistics;
}

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) {
    return NextResponse.json([], { status: 200 });
  }

  try {
    // Step 1: Get the channel's uploads playlist ID
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
    const channelRes = await fetch(channelUrl, { cache: "no-store" });

    if (!channelRes.ok) {
      console.error("YouTube channels API error:", await channelRes.text());
      return NextResponse.json([], { status: 200 });
    }

    const channelData = await channelRes.json();
    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json([], { status: 200 });
    }

    // Step 2: Get the 5 most recent videos from the uploads playlist
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=5&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl, { cache: "no-store" });

    if (!playlistRes.ok) {
      console.error(
        "YouTube playlistItems API error:",
        await playlistRes.text(),
      );
      return NextResponse.json([], { status: 200 });
    }

    const playlistData = await playlistRes.json();
    const items: PlaylistItem[] = playlistData.items ?? [];

    if (items.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Step 3: Get statistics for each video
    const videoIds = items
      .map((item) => item.snippet.resourceId.videoId)
      .join(",");
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl, { cache: "no-store" });

    const statsMap: Record<string, VideoStatistics> = {};
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      for (const item of (statsData.items ?? []) as VideoItem[]) {
        statsMap[item.id] = item.statistics;
      }
    }

    const videos: YouTubeVideo[] = items.map((item) => {
      const videoId = item.snippet.resourceId.videoId;
      const stats = statsMap[videoId] ?? {};
      const thumb =
        item.snippet.thumbnails.high ??
        item.snippet.thumbnails.medium ??
        item.snippet.thumbnails.default;

      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: thumb?.url ?? "",
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(stats.viewCount ?? "0", 10),
        likeCount: parseInt(stats.likeCount ?? "0", 10),
        commentCount: parseInt(stats.commentCount ?? "0", 10),
      };
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("YouTube fetch error:", error);
    return NextResponse.json([], { status: 200 });
  }
}

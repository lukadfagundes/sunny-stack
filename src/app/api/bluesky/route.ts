import { NextResponse } from "next/server";

export interface BlueskyFacetFeature {
  $type: string;
  uri?: string;
  did?: string;
  tag?: string;
}

export interface BlueskyFacet {
  index: { byteStart: number; byteEnd: number };
  features: BlueskyFacetFeature[];
}

export interface BlueskyEmbed {
  type: "external" | "images" | "unknown";
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  images?: {
    thumb: string;
    fullsize: string;
    alt: string;
  }[];
}

export interface BlueskyPost {
  text: string;
  facets: BlueskyFacet[];
  embed: BlueskyEmbed | null;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  permalink: string;
  createdAt: string;
}

interface APIEmbed {
  $type: string;
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  images?: {
    thumb: string;
    fullsize: string;
    alt: string;
  }[];
}

interface FeedViewPost {
  post: {
    uri: string;
    author: {
      handle: string;
    };
    record: {
      text: string;
      createdAt: string;
      facets?: BlueskyFacet[];
    };
    embed?: APIEmbed;
    likeCount?: number;
    replyCount?: number;
    repostCount?: number;
  };
}

let cache: { data: BlueskyPost | null; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function transformEmbed(embed?: APIEmbed): BlueskyEmbed | null {
  if (!embed) return null;

  if (embed.$type === "app.bsky.embed.external#view" && embed.external) {
    return {
      type: "external",
      external: {
        uri: embed.external.uri,
        title: embed.external.title,
        description: embed.external.description,
        thumb: embed.external.thumb,
      },
    };
  }

  if (embed.$type === "app.bsky.embed.images#view" && embed.images) {
    return {
      type: "images",
      images: embed.images.map((img) => ({
        thumb: img.thumb,
        fullsize: img.fullsize,
        alt: img.alt,
      })),
    };
  }

  return null;
}

export async function GET() {
  const handle = process.env.BLUESKY_HANDLE;

  if (!handle) {
    return NextResponse.json(null, { status: 200 });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=1&filter=posts_no_replies`;

    const response = await fetch(url, { next: { revalidate: 300 } });

    if (!response.ok) {
      console.error("Bluesky API error:", await response.text());
      return NextResponse.json(null, { status: 200 });
    }

    const json = await response.json();
    const feedItem: FeedViewPost | undefined = json.feed?.[0];

    if (!feedItem) {
      return NextResponse.json(null, { status: 200 });
    }

    const post = feedItem.post;
    const rkey = post.uri.split("/").pop();
    const permalink = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;

    const result: BlueskyPost = {
      text: post.record.text,
      facets: post.record.facets ?? [],
      embed: transformEmbed(post.embed),
      likeCount: post.likeCount ?? 0,
      replyCount: post.replyCount ?? 0,
      repostCount: post.repostCount ?? 0,
      permalink,
      createdAt: post.record.createdAt,
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Bluesky fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

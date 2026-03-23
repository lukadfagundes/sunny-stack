"use client";

import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import type { InstagramPost } from "@/app/api/instagram/route";

interface PostCardProps {
  post: InstagramPost;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <div style={{ borderBottom: "1px solid #262626" }}>
      {/* Image */}
      <a
        href={post.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="aspect-square relative overflow-hidden">
          <Image
            src={post.imageUrl}
            alt={post.caption || "Instagram photo"}
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover"
          />
        </div>
      </a>

      {/* Engagement + caption */}
      <div className="px-3 pt-2 pb-8">
        {/* Like & comment counts */}
        <div
          className="flex items-center gap-4 mb-1"
          style={{ color: "#FAFAFA" }}
        >
          <span className="flex items-center gap-1.5 text-sm">
            <Heart className="w-4 h-4" />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <MessageCircle className="w-4 h-4" />
            {post.commentsCount}
          </span>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mt-1" style={{ color: "#A8A8A8" }}>
            {post.caption}
          </p>
        )}

        {/* Date */}
        <p
          className="text-xs mt-2"
          style={{ color: "#737373" }}
        >
          {new Date(post.timestamp).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

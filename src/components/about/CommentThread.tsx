"use client";

import { Heart } from "lucide-react";
import type {
  InstagramComment,
  InstagramCommentReply,
} from "@/app/api/instagram/comments/route";

interface CommentThreadProps {
  comments: InstagramComment[];
  loading: boolean;
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function CommentRow({
  username,
  text,
  likeCount,
  timestamp,
  isReply,
}: {
  username: string;
  text: string;
  likeCount: number;
  timestamp: string;
  isReply?: boolean;
}) {
  return (
    <div className={isReply ? "ml-8 mt-2" : ""}>
      <p className="text-sm" style={{ color: "#A8A8A8" }}>
        <span
          className="font-semibold mr-1.5"
          style={{ color: "#FAFAFA" }}
        >
          {username}
        </span>
        {text}
      </p>
      <div
        className="flex items-center gap-3 mt-1 text-xs"
        style={{ color: "#737373" }}
      >
        <span>{relativeTime(timestamp)}</span>
        {likeCount > 0 && (
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {likeCount}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({
  comments,
  loading,
}: CommentThreadProps) {
  if (loading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div
              className="h-3 w-32 animate-pulse rounded"
              style={{ background: "#262626" }}
            />
            <div
              className="h-3 w-48 animate-pulse rounded"
              style={{ background: "#262626" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-sm py-2" style={{ color: "#737373" }}>
        No comments
      </p>
    );
  }

  return (
    <div className="space-y-3 py-2">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentRow
            username={comment.username}
            text={comment.text}
            likeCount={comment.likeCount}
            timestamp={comment.timestamp}
          />
          {comment.replies.map((reply: InstagramCommentReply) => (
            <CommentRow
              key={reply.id}
              username={reply.username}
              text={reply.text}
              likeCount={reply.likeCount}
              timestamp={reply.timestamp}
              isReply
            />
          ))}
        </div>
      ))}
    </div>
  );
}

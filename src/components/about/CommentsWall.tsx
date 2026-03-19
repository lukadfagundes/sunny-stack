"use client";

import { User } from "lucide-react";
import { profile, comments } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

export default function CommentsWall() {
  return (
    <div>
      <SectionHeader
        title={`${profile.name}'s Comments`}
      />
      <div className="bg-sunny-surface rounded-b-md border-x border-b border-sunny-surface-light">
        {comments.length === 0 ? (
          <p className="px-4 py-3 text-sm text-sunny-cream-muted">
            No comments yet
          </p>
        ) : (
          <div className="divide-y divide-sunny-surface-light">
            {comments.map((comment, i) => (
              <div key={i} className="p-4 flex gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-sunny-bg"
                  style={{
                    border: "1px solid #3D2E1F",
                  }}
                >
                  <User className="w-5 h-5 text-sunny-cream-muted" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-medium text-sunny-gold hover:underline cursor-pointer">
                      {comment.name}
                    </span>
                    <span className="text-[10px] text-sunny-cream-muted">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-sunny-cream leading-relaxed">
                    {comment.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

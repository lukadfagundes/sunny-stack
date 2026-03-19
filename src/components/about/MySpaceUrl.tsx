"use client";

import { myspaceUrl } from "@/lib/data/personal";

export default function MySpaceUrl() {
  return (
    <div className="text-xs">
      <span className="text-sunny-cream-muted font-medium">MySpace URL:</span>
      <div
        className="mt-1 px-2 py-1.5 bg-sunny-bg text-sunny-cream-muted truncate"
        style={{ border: "1px solid #3D2E1F", borderRadius: 2 }}
      >
        {myspaceUrl}
      </div>
    </div>
  );
}

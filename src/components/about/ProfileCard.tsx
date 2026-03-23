"use client";

import { User } from "lucide-react";
import { profile } from "@/lib/data/personal";

interface ProfileCardProps {
  onViewPics?: () => void;
}

export default function ProfileCard({ onViewPics }: ProfileCardProps) {
  return (
    <div>
      {/* Name + tagline */}
      <h2 className="text-xl font-bold text-sunny-cream mb-0.5">
        {profile.name}
      </h2>
      <p className="text-sm text-sunny-cream-muted italic mb-3">
        {profile.tagline}
      </p>

      {/* Profile photo placeholder */}
      <div className="flex gap-4 mb-3">
        <div
          className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-sunny-surface"
          style={{ border: "1px solid #3D2E1F" }}
        >
          <User className="w-12 h-12 text-sunny-cream-muted" />
          <span className="sr-only">NO PHOTO</span>
        </div>

        <div className="text-xs text-sunny-cream-muted space-y-1">
          <p>{profile.gender}</p>
          <p>{profile.age} years old</p>
          <p className="uppercase font-medium text-sunny-cream">
            {profile.location}
          </p>
          <p>{profile.country}</p>
        </div>
      </div>

      {/* Online status */}
      <p className="text-xs mb-1">
        <span className="text-green-500 font-bold">&#9830;</span>{" "}
        <span className="text-green-500 font-medium">{profile.status}</span>
      </p>

      {/* Last login */}
      <p className="text-xs text-sunny-cream-muted mb-3">
        Last Login: {profile.lastLogin}
      </p>

      {/* View My links */}
      <p className="text-xs text-sunny-cream-muted">
        View My:{" "}
        <button
          onClick={onViewPics}
          className="text-sunny-gold hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit text-xs"
        >
          Pics
        </button>
        {" | "}
        <span className="text-sunny-gold hover:underline cursor-pointer">
          Videos
        </span>
      </p>
    </div>
  );
}

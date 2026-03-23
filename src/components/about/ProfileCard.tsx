"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { profile, BIRTHDATE, calculateAge } from "@/lib/data/personal";
import type { GitHubProfile } from "@/app/api/github/route";
import type { ActivityStatus } from "@/app/api/activity/route";

interface ProfileCardProps {
  onViewPics?: () => void;
  onViewVideos?: () => void;
}

export default function ProfileCard({ onViewPics, onViewVideos }: ProfileCardProps) {
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null);
  const [activity, setActivity] = useState<ActivityStatus | null>(null);

  useEffect(() => {
    fetch("/api/github")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: GitHubProfile | null) => {
        setGithubProfile(data && data.avatarUrl ? data : null);
      })
      .catch(() => {
        // Silently fail — fallback to placeholder icon
      });

    fetch("/api/activity")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: ActivityStatus) => {
        setActivity(data);
      })
      .catch(() => {
        // Silently fail — fallback to offline
      });
  }, []);

  const age = calculateAge(BIRTHDATE);
  const isOnline = activity?.isOnline ?? false;
  const lastLogin = activity?.lastActivityAt
    ? new Date(activity.lastActivityAt).toLocaleDateString("en-US")
    : profile.lastLogin;

  return (
    <div>
      {/* Name + tagline */}
      <h2 className="text-xl font-bold text-sunny-cream mb-0.5">
        {profile.name}
      </h2>
      <p className="text-sm text-sunny-cream-muted italic mb-3">
        {profile.tagline}
      </p>

      {/* Profile photo */}
      <div className="flex gap-4 mb-3">
        <div
          className="w-24 h-24 flex-shrink-0 flex items-center justify-center bg-sunny-surface overflow-hidden"
          style={{ border: "1px solid #3D2E1F" }}
        >
          {githubProfile?.avatarUrl ? (
            <Image
              src={githubProfile.avatarUrl}
              alt={`${profile.name}'s profile photo`}
              width={96}
              height={96}
              className="object-cover"
            />
          ) : (
            <>
              <User className="w-12 h-12 text-sunny-cream-muted" />
              <span className="sr-only">NO PHOTO</span>
            </>
          )}
        </div>

        <div className="text-xs text-sunny-cream-muted space-y-1">
          <p>{profile.gender}</p>
          <p>{age} years old</p>
          <p className="uppercase font-medium text-sunny-cream">
            {profile.location}
          </p>
          <p>{profile.country}</p>
        </div>
      </div>

      {/* Online status */}
      <p className="text-xs mb-1">
        {isOnline ? (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
            <span className="text-green-500 font-medium">Online Now!</span>
          </>
        ) : (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
            <span className="text-red-500 font-medium">Offline</span>
          </>
        )}
      </p>

      {/* Last login */}
      <p className="text-xs text-sunny-cream-muted mb-3">
        Last Login: {lastLogin}
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
        <button
          onClick={onViewVideos}
          className="text-sunny-gold hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit text-xs"
        >
          Videos
        </button>
      </p>
    </div>
  );
}

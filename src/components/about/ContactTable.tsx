"use client";

import {
  Instagram,
  CloudSun,
  Youtube,
  Github,
  Mail,
} from "lucide-react";
import { contactLinks } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

function XIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  instagram: Instagram,
  twitter: XIcon,
  bluesky: CloudSun,
  youtube: Youtube,
  github: Github,
  email: Mail,
};

const COLOR_MAP: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#FFFFFF",
  bluesky: "#0085FF",
  youtube: "#FF0000",
  github: "#F5E6D3",
  email: "#F0B429",
};

export default function ContactTable() {
  return (
    <div>
      <SectionHeader title={`Contacting ${"\u00A0"}Luka`} />
      <div className="bg-sunny-surface rounded-b-md border-x border-b border-sunny-surface-light p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {contactLinks.map((link) => {
            const Icon = ICON_MAP[link.type];
            const color = COLOR_MAP[link.type];
            const isExternal = link.type !== "email";
            return (
              <a
                key={link.label}
                href={link.url}
                {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80 text-left py-0.5"
                style={{ color }}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

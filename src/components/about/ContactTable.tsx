"use client";

import {
  Mail,
  UserPlus,
  Forward,
  Star,
  MessageSquare,
  Ban,
  Users,
  Award,
} from "lucide-react";
import { contactActions } from "@/lib/data/personal";
import SectionHeader from "./SectionHeader";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  mail: Mail,
  "user-plus": UserPlus,
  forward: Forward,
  star: Star,
  "message-square": MessageSquare,
  ban: Ban,
  users: Users,
  award: Award,
};

export default function ContactTable() {
  return (
    <div>
      <SectionHeader title={`Contacting ${"\u00A0"}Luka`} />
      <div className="bg-sunny-surface rounded-b-md border-x border-b border-sunny-surface-light p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {contactActions.map((action) => {
            const Icon = ICON_MAP[action.icon];
            return (
              <button
                key={action.label}
                className="flex items-center gap-2 text-xs text-sunny-gold hover:text-sunny-cream transition-colors text-left py-0.5"
                tabIndex={-1}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

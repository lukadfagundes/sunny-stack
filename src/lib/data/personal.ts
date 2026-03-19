/** Personal/MySpace profile data for the About page. Pure TypeScript — no React imports. */

// ── Types ──

export interface ProfileData {
  name: string;
  tagline: string;
  gender: string;
  age: number;
  location: string;
  country: string;
  status: "Online Now!" | "Offline";
  lastLogin: string;
}

export interface DetailRow {
  label: string;
  value: string;
}

export interface ContactAction {
  label: string;
  icon: "mail" | "user-plus" | "forward" | "star" | "message-square" | "ban" | "users" | "award";
}

export interface InterestRow {
  label: string;
  value: string;
}

export interface TopEightItem {
  name: string;
  reason: string;
}

export interface MusicPlayerData {
  trackName: string;
  artist: string;
}

export interface WallComment {
  name: string;
  timestamp: string;
  message: string;
  initials: string;
  accentColor: string;
}

export interface ContactLink {
  label: string;
  url: string;
  type: "github" | "linkedin" | "email";
}

export interface BlogEntry {
  title: string;
  preview: string;
}

// ── Profile ──

export const profile: ProfileData = {
  name: "Luka",
  tagline: '"Placeholder tagline"',
  gender: "Male",
  age: 0,
  location: "PLACEHOLDER CITY, STATE",
  country: "United States",
  status: "Online Now!",
  lastLogin: "1/1/2025",
};

// ── Contacting Actions (MySpace 8-link table) ──

export const contactActions: ContactAction[] = [
  { label: "Send Message", icon: "mail" },
  { label: "Forward to Friend", icon: "forward" },
  { label: "Add to Friends", icon: "user-plus" },
  { label: "Add to Favorites", icon: "star" },
  { label: "Instant Message", icon: "message-square" },
  { label: "Block User", icon: "ban" },
  { label: "Add to Group", icon: "users" },
  { label: "Rank User", icon: "award" },
];

// ── MySpace URL ──

export const myspaceUrl = "http://www.myspace.com/placeholder";

// ── Details ──

export const details: DetailRow[] = [
  { label: "Status", value: "Placeholder" },
  { label: "Body type", value: "Placeholder" },
  { label: "Here for", value: "Placeholder" },
  { label: "Zodiac Sign", value: "Placeholder" },
];

// ── Blog Entry ──

export const latestBlog: BlogEntry = {
  title: "Placeholder Blog Entry Title",
  preview: "Placeholder blog entry preview text...",
};

// ── About Me (Blurbs) ──

export const aboutMe = "Placeholder about me text. This section will contain a personal bio.";

// ── Who I'd Like to Meet ──

export const whoIdLikeToMeet = "Placeholder who I'd like to meet text.";

// ── Interests Table ──

export const interests: InterestRow[] = [
  { label: "General", value: "Placeholder" },
  { label: "Music", value: "Placeholder" },
  { label: "Movies", value: "Placeholder" },
  { label: "Television", value: "Placeholder" },
  { label: "Books", value: "Placeholder" },
  { label: "Heroes", value: "Placeholder" },
];

// ── Top 8 (Friend Space) ──

export const topEight: TopEightItem[] = [
  { name: "Friend 1", reason: "Placeholder" },
  { name: "Friend 2", reason: "Placeholder" },
  { name: "Friend 3", reason: "Placeholder" },
  { name: "Friend 4", reason: "Placeholder" },
  { name: "Friend 5", reason: "Placeholder" },
  { name: "Friend 6", reason: "Placeholder" },
  { name: "Friend 7", reason: "Placeholder" },
  { name: "Friend 8", reason: "Placeholder" },
];

// ── Music Player (static, no audio) ──

export const musicPlayer: MusicPlayerData = {
  trackName: "Placeholder Track",
  artist: "Placeholder Artist",
};

// ── Comments Wall ──

export const comments: WallComment[] = [
  {
    name: "Friend 1",
    initials: "F1",
    accentColor: "#F0B429",
    timestamp: "1/1/2025",
    message: "Placeholder comment text.",
  },
  {
    name: "Friend 2",
    initials: "F2",
    accentColor: "#3B82F6",
    timestamp: "1/1/2025",
    message: "Placeholder comment text.",
  },
];

// ── Contact Links (modern) ──

export const contactLinks: ContactLink[] = [
  { label: "GitHub", url: "https://github.com/placeholder", type: "github" },
  { label: "LinkedIn", url: "https://linkedin.com/in/placeholder", type: "linkedin" },
  { label: "Email", url: "mailto:placeholder@example.com", type: "email" },
];

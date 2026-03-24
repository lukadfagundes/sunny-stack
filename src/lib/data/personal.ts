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

export interface InterestRow {
  label: string;
  value: string;
}

export interface MusicPlayerData {
  trackName: string;
  artist: string;
}

export interface ContactLink {
  label: string;
  url: string;
  type: "instagram" | "twitter" | "bluesky" | "youtube" | "github" | "email";
}

export interface BlogEntry {
  title: string;
  preview: string;
}

// ── Birthdate (for dynamic age calculation) ──

export const BIRTHDATE = "1993-06-14";

export function calculateAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ── Profile ──

export const profile: ProfileData = {
  name: "Luka",
  tagline: '"Placeholder tagline"',
  gender: "He/Him",
  age: 0,
  location: "CA",
  country: "United States",
  status: "Online Now!",
  lastLogin: "1/1/2025",
};

// ── Details ──

export const details: DetailRow[] = [
  { label: "Status", value: "Married" },
  { label: "Pets", value: "Aly & AJ" },
  { label: "Comfort Movie", value: "Mean Girls" },
  { label: "Zodiac Sign", value: "Gemini" },
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
  { label: "General", value: "Cooking, Video Games, TV, Gym, Concerts, Coding, D&D" },
  { label: "Music", value: "Placeholder" },
  { label: "Movies", value: "Mean Girls, Secondhand Lions, Spirited Away, Troll 2, Life Aquatic" },
  { label: "Television", value: "One Piece, HIMYM, Frieren, New Girl, Fullmetal Alchemist Brotherhood" },
  { label: "Books", value: "The Hitchhiker's Guide to the Galaxy, House of Leaves, The Salmon of Doubt" },
  { label: "Heroes", value: "My Wife, Eiichiro Oda, Sandwich Artists, Paul Rudd, Whoever decided to give Gordon subtitles in Black Clover" },
];

// ── Music Player (static, no audio) ──

export const musicPlayer: MusicPlayerData = {
  trackName: "Placeholder Track",
  artist: "Placeholder Artist",
};

// ── Contact Links (modern) ──

export const contactLinks: ContactLink[] = [
  { label: "Instagram", url: "https://www.instagram.com/strawhatluka/", type: "instagram" },
  { label: "X", url: "https://x.com/strawhatluka", type: "twitter" },
  { label: "Bluesky", url: "https://bsky.app/profile/strawhatluka.bsky.social", type: "bluesky" },
  { label: "YouTube", url: "https://www.youtube.com/@strawhatluka", type: "youtube" },
  { label: "GitHub", url: "https://github.com/strawhatluka", type: "github" },
  { label: "Email", url: "mailto:luka@sunny-stack.com", type: "email" },
];

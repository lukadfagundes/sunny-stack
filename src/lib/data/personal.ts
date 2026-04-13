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
  tagline: '"Wealth. Fame. Power... I just want a basement."',
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

export const aboutMe =
  "I'm Luka. I'm a little scatterbrained, a lot chaotic, and I care deeply about the people I let in. My wife is my favorite person, a perfect day is tide pools in the morning, ice cream after lunch, and gaming together until we can't keep our eyes open. I'm the type to be up at 3 AM losing it at a dumb Reel and then quoting it for the next two weeks. I watch Mean Girls on repeat, I think Andy Cohen single-handedly ruined reality TV, and I will talk about One Piece like it's high literature. Mornings are fine as long as nobody set an alarm. I run on little treats and dry humor. If Monsters in the Closet is playing, leave me alone, I'm having a moment.";

// ── Who I'd Like to Meet ──

export const whoIdLikeToMeet =
  "Eiichiro Oda. That's it. One Piece is one of a kind and nothing else comes close. I'd love to just cook him dinner and talk about the life experiences he pulled from to build arcs like Enies Lobby. \"I want to live\" rewired something in me. I wouldn't need anything fancy, just a meal, a conversation, and one honest answer about the Croco-mom theory.";

// ── Interests Table ──

export const interests: InterestRow[] = [
  {
    label: "General",
    value: "Cooking, Video Games, TV, Gym, Concerts, Coding, D&D",
  },
  { label: "Music", value: "Placeholder" },
  {
    label: "Movies",
    value: "Mean Girls, Secondhand Lions, Spirited Away, Troll 2, Life Aquatic",
  },
  {
    label: "Television",
    value:
      "One Piece, HIMYM, Frieren, New Girl, Fullmetal Alchemist Brotherhood",
  },
  {
    label: "Books",
    value:
      "The Hitchhiker's Guide to the Galaxy, House of Leaves, The Salmon of Doubt",
  },
  {
    label: "Heroes",
    value:
      "My Wife, Eiichiro Oda, Sandwich Artists, Paul Rudd, Whoever decided to give Gordon subtitles in Black Clover",
  },
];

// ── Music Player (static, no audio) ──

export const musicPlayer: MusicPlayerData = {
  trackName: "Placeholder Track",
  artist: "Placeholder Artist",
};

// ── Contact Links (modern) ──

export const contactLinks: ContactLink[] = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/strawhatluka/",
    type: "instagram",
  },
  { label: "X", url: "https://x.com/strawhatluka", type: "twitter" },
  {
    label: "Bluesky",
    url: "https://bsky.app/profile/strawhatluka.bsky.social",
    type: "bluesky",
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/@strawhatluka",
    type: "youtube",
  },
  { label: "GitHub", url: "https://github.com/strawhatluka", type: "github" },
  { label: "Email", url: "mailto:luka@sunny-stack.com", type: "email" },
];

# Personal Data Module

## Overview

Static personal and profile data for the About page. Contains profile information, details, interests, contact links, blog entry, bio sections, and a music player configuration. Includes a dynamic age calculator. Pure TypeScript with no React imports.

**Source:** `src/lib/data/personal.ts` (124 lines)

## Exports

### Functions

#### `calculateAge(birthdate: string): number`

Calculates age from a birthdate string, accounting for whether the birthday has occurred this year.

**Parameters:**

- `birthdate` (`string`) -- Date string parseable by `new Date()` (e.g., `"1993-06-14"`)

**Returns:** `number` -- Current age in years

**Logic:**

1. Computes year difference between today and birth year
2. Subtracts 1 if the birthday hasn't occurred yet this year (checks month and day)

### Constants

#### `BIRTHDATE: string`

Value: `"1993-06-14"`

#### `profile: ProfileData`

Main profile card data:

- `name`: `"Luka"`
- `tagline`: `'"Placeholder tagline"'`
- `gender`: `"He/Him"`
- `age`: `0` (calculated dynamically by consuming component using `calculateAge(BIRTHDATE)`)
- `location`: `"CA"`
- `country`: `"United States"`
- `status`: `"Online Now!"`
- `lastLogin`: `"1/1/2025"`

#### `details: DetailRow[]`

Array of 4 detail rows:

| Label         | Value      |
| ------------- | ---------- |
| Status        | Married    |
| Pets          | Aly & AJ   |
| Comfort Movie | Mean Girls |
| Zodiac Sign   | Gemini     |

#### `interests: InterestRow[]`

Array of 6 interest categories:

| Label      | Value                                                                      |
| ---------- | -------------------------------------------------------------------------- |
| General    | Cooking, Video Games, TV, Gym, Concerts, Coding, D&D                       |
| Music      | Placeholder                                                                |
| Movies     | Mean Girls, Secondhand Lions, Spirited Away, Troll 2, Life Aquatic         |
| Television | One Piece, HIMYM, Frieren, New Girl, Fullmetal Alchemist Brotherhood       |
| Books      | The Hitchhiker's Guide to the Galaxy, House of Leaves, The Salmon of Doubt |
| Heroes     | My Wife, Eiichiro Oda, Sandwich Artists, Paul Rudd, ...                    |

#### `contactLinks: ContactLink[]`

Array of 8 social media/contact links:

| Label     | Type      | URL                                                  |
| --------- | --------- | ---------------------------------------------------- |
| Instagram | instagram | https://www.instagram.com/strawhatluka/              |
| X         | twitter   | https://x.com/strawhatluka                           |
| Bluesky   | bluesky   | https://bsky.app/profile/strawhatluka.bsky.social    |
| Twitch    | twitch    | https://www.twitch.tv/xxwishkeeperxx                 |
| YouTube   | youtube   | https://www.youtube.com/@strawhatluka                |
| LinkedIn  | linkedin  | https://www.linkedin.com/in/luka-fagundes-54785a102/ |
| GitHub    | github    | https://github.com/strawhatluka                      |
| Email     | email     | mailto:luka@sunny-stack.com                          |

#### `latestBlog: BlogEntry`

Static blog entry with placeholder title and preview text.

#### `aboutMe: string`

Placeholder "About Me" biography text.

#### `whoIdLikeToMeet: string`

Placeholder "Who I'd Like to Meet" text.

#### `musicPlayer: MusicPlayerData`

Static music player data with placeholder track name and artist.

### Types/Interfaces

#### `ProfileData` (exported)

```typescript
interface ProfileData {
  name: string;
  tagline: string;
  gender: string;
  age: number;
  location: string;
  country: string;
  status: "Online Now!" | "Offline";
  lastLogin: string;
}
```

#### `DetailRow` (exported)

```typescript
interface DetailRow {
  label: string;
  value: string;
}
```

#### `InterestRow` (exported)

```typescript
interface InterestRow {
  label: string;
  value: string;
}
```

#### `MusicPlayerData` (exported)

```typescript
interface MusicPlayerData {
  trackName: string;
  artist: string;
}
```

#### `ContactLink` (exported)

```typescript
interface ContactLink {
  label: string;
  url: string;
  type:
    | "instagram"
    | "twitter"
    | "bluesky"
    | "twitch"
    | "youtube"
    | "linkedin"
    | "github"
    | "email";
}
```

#### `BlogEntry` (exported)

```typescript
interface BlogEntry {
  title: string;
  preview: string;
}
```

## Dependencies

- No external dependencies (pure TypeScript)

## Usage

```typescript
import {
  profile,
  details,
  interests,
  contactLinks,
  calculateAge,
  BIRTHDATE,
  latestBlog,
  aboutMe,
  whoIdLikeToMeet,
  musicPlayer,
} from "@/lib/data/personal";

const currentAge = calculateAge(BIRTHDATE);
```

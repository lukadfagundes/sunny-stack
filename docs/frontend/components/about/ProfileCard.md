# ProfileCard

## Overview

A client-side component that renders the user's profile card in a MySpace-inspired layout. It displays the profile photo (fetched from GitHub), personal details (name, tagline, gender, dynamically calculated age, location, country), real-time online/offline status (fetched from an activity API), last login date, and navigation links to the photo and video galleries.

**Source:** `src/components/about/ProfileCard.tsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onViewPics` | `() => void` | No | Callback invoked when the user clicks the "Pics" link. Used by the parent to switch to the PhotoGallery view. |
| `onViewVideos` | `() => void` | No | Callback invoked when the user clicks the "Videos" link. Used by the parent to switch to the VideoGallery view. |

### Props Interface

```ts
interface ProfileCardProps {
  onViewPics?: () => void;
  onViewVideos?: () => void;
}
```

## State Management

| Hook | State Variable | Type | Initial Value | Purpose |
|------|---------------|------|---------------|---------|
| `useState` | `githubProfile` | `GitHubProfile \| null` | `null` | Stores the GitHub profile data (primarily `avatarUrl`) fetched from the API. |
| `useState` | `activity` | `ActivityStatus \| null` | `null` | Stores the activity status data (`isOnline`, `lastActivityAt`) fetched from the API. |

## API Integration

### 1. GitHub Profile (`/api/github`)
- **Method:** `GET`
- **Triggered:** On mount via `useEffect` (empty dependency array)
- **Response Type:** `GitHubProfile` (imported from `@/app/api/github/route`)
- **Fields Used:** `avatarUrl`
- **Error Handling:** Silently fails; falls back to a placeholder `User` icon from lucide-react
- **Validation:** Only sets state if `data` is truthy and `data.avatarUrl` exists

### 2. Activity Status (`/api/activity`)
- **Method:** `GET`
- **Triggered:** On mount via `useEffect` (empty dependency array)
- **Response Type:** `ActivityStatus` (imported from `@/app/api/activity/route`)
- **Fields Used:** `isOnline`, `lastActivityAt`
- **Error Handling:** Silently fails; falls back to offline status and static `lastLogin` from profile data

## Event Handlers

| Handler | Element | Description |
|---------|---------|-------------|
| `onViewPics` | "Pics" `<button>` | Delegates to parent callback to navigate to photo gallery |
| `onViewVideos` | "Videos" `<button>` | Delegates to parent callback to navigate to video gallery |

## Child Components

- **`Image`** (from `next/image`) -- Renders the GitHub avatar at 96x96 pixels
- **`User`** (from `lucide-react`) -- Fallback icon when no GitHub avatar is available

## Data Sources

| Source | Import Path | Fields Used |
|--------|-------------|-------------|
| `profile` | `@/lib/data/personal` | `name`, `tagline`, `gender`, `location`, `country`, `lastLogin` |
| `BIRTHDATE` | `@/lib/data/personal` | Used with `calculateAge()` to compute current age |
| `calculateAge` | `@/lib/data/personal` | Pure function that calculates age from a birthdate string |
| `GitHubProfile` (type) | `@/app/api/github/route` | `avatarUrl`, `name`, `bio`, `location`, `lastPushedAt` |
| `ActivityStatus` (type) | `@/app/api/activity/route` | `isOnline`, `lastActivityAt` |

## Derived Values

- **`age`** -- Computed via `calculateAge(BIRTHDATE)` on every render
- **`isOnline`** -- `activity?.isOnline ?? false` (defaults to offline)
- **`lastLogin`** -- Uses `activity.lastActivityAt` formatted as a locale date string, or falls back to `profile.lastLogin`

## Usage

```tsx
<ProfileCard
  onViewPics={() => setView("pics")}
  onViewVideos={() => setView("videos")}
/>
```

## Integration Points

- **Parent:** The About page or a parent layout component passes `onViewPics` and `onViewVideos` callbacks to control gallery view switching.
- **APIs:** Depends on `/api/github` and `/api/activity` endpoints being available. Gracefully degrades if either is unreachable.
- **Static Data:** Imports `profile`, `BIRTHDATE`, and `calculateAge` from `@/lib/data/personal` for baseline profile information.

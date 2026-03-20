# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add `.env.example` to provide a template for environment variables.
- Add `src/components/404/DPad.tsx` component for game input controls, addressing issue #84.
- Add `src/components/404/GameBoard.tsx` component to render the game board, addressing issue #84.
- Add `src/components/404/GameHUD.tsx` component to display game-related information, addressing issue #84.
- Add `src/components/404/GameTile.tsx` component to represent individual game tiles, addressing issue #84.
- Add `src/components/404/StaticNotFound.tsx` component for a simplified 404 page experience, addressing issue #84.
- Add `src/components/404/WinCelebration.tsx` component to display win animations, addressing issue #84.
- Add `src/components/404/ZoroGame.tsx` as the main interactive 404 game component, addressing issue #84.
- Add `src/components/404/grid.ts` utility file for game grid logic, addressing issue #84.
- Add `src/components/404/quotes.ts` utility file for game-related quotes, addressing issue #84.
- Add `src/components/404/reducer.ts` for managing game state logic, addressing issue #84.
- Add `src/components/404/types.ts` for defining game-related TypeScript types, addressing issue #84.
- Add `src/components/404/useGameInput.ts` custom hook for handling game input, addressing issue #84.
- Add `src/components/landing/ContributionHeatmap.tsx` component for displaying GitHub contributions.
- Add `src/components/landing/CurrentlyBuilding.tsx` component to highlight current projects.
- Add `src/components/landing/StatsDashboard.tsx` component for displaying developer statistics.
- Add `src/components/landing/TechArsenal.tsx` component to showcase technologies used.
- Add `src/components/landing/VoyageSail.tsx` component for the landing page background animation.
- Add `src/lib/github.ts` utility file for fetching GitHub data.
- Add `src/components/404/DPad.tsx` component for game input controls.
- Add `src/components/404/GameBoard.tsx` component to render the game board.
- Add `src/components/404/GameHUD.tsx` component to display game-related information.
- Add `src/components/404/GameTile.tsx` component to represent individual game tiles.
- Add `src/components/404/StaticNotFound.tsx` component for a simplified 404 page experience.
- Add `src/components/404/WinCelebration.tsx` component to display win animations.
- Add `src/components/404/ZoroGame.tsx` as the main interactive 404 game component.
- Add `src/components/404/grid.ts` utility file for game grid logic.
- Add `src/components/404/quotes.ts` utility file for game-related quotes.
- Add `src/components/404/reducer.ts` utility file for game state management.
- Add `src/components/404/types.ts` utility file for game type definitions.
- Add `src/components/404/useGameInput.ts` custom hook for handling game input.
- Implement new 404 Not Found page experience in `src/app/not-found.tsx` by conditionally rendering `ZoroGame` or `StaticNotFound`.
- Add `src/app/not-found.tsx` to provide a custom 404 Not Found page.
- Implement a comprehensive About page (`src/app/about/page.tsx`) to replace the "Coming Soon" placeholder, displaying personal details, interests, contacts, and blog entries (resolves #84).
- Add `src/components/about/BioSections.tsx` to display biographical sections on the About page (resolves #84).
- Add `src/components/about/BlogEntry.tsx` component for displaying individual blog entries on the About page (resolves #84).
- Add `src/components/about/CommentsWall.tsx` component to feature a wall of comments on the About page (resolves #84).
- Add `src/components/about/ContactTable.tsx` component to display contact information in a table format on the About page (resolves #84).
- Add `src/components/about/DetailsBox.tsx` component for showcasing various personal details on the About page (resolves #84).
- Add `src/components/about/InterestsTable.tsx` component to list interests in a table format on the About page (resolves #84).
- Add `src/components/about/MusicPlayer.tsx` component to embed a music player on the About page (resolves #84).
- Add `src/components/about/MySpaceUrl.tsx` component for displaying a MySpace-style URL on the About page (resolves #84).
- Add `src/components/about/NetworkBanner.tsx` component to display a network banner on the About page (resolves #84).
- Add `src/components/about/ProfileCard.tsx` component to present a user profile card on the About page (resolves #84).
- Add `src/components/about/SectionHeader.tsx` component for consistent section titling across the About page (resolves #84).
- Add `src/components/about/TopEight.tsx` component to display a 'Top 8' friends/contacts section on the About page (resolves #84).
- Add `src/lib/data/personal.ts` to manage and retrieve personal data for the About page (resolves #84).
- Implement a dynamic portfolio page (`src/app/portfolio/page.tsx`) to replace the "Coming Soon" placeholder, enabling display of categorized projects (resolves #84).
- Create `src/components/portfolio/CategorySection.tsx` to group and display projects by category (resolves #84).
- Create `src/components/portfolio/ProjectCard.tsx` to display individual project details within the portfolio (resolves #84).
- Add `src/lib/data/projects.ts` to manage and retrieve project data, including `getProjectsByCategory` (resolves #84).
- Define project-related TypeScript types in `src/lib/data/types.ts`, including `ProjectCategory` (resolves #84).
- Configure ESLint for the project by adding `eslint.config.mjs`.
- Configure Next.js project settings by adding `next.config.ts`
- Generate `package-lock.json` to lock project dependencies.
- Initialize `package.json` with project metadata and scripts for a new Next.js application
- Configure PostCSS for styling by adding `postcss.config.mjs`.
- Create `src/app/about/page.tsx` for the About page
- Create `src/app/contact/page.tsx` for the Contact page
- Add `src/app/favicon.ico` for the application's favicon.
- Implement global styles by adding `src/app/globals.css`.
- Create `src/app/layout.tsx` to define the root layout structure for the application,
- Create `src/app/page.tsx` for the main landing page
- Create `src/app/portfolio/page.tsx` for the Portfolio page
- Create `src/components/HeroSection.tsx` for displaying hero content
- Create `src/components/LetterReveal.tsx` for animated text reveals
- Create `src/components/ShipWheel.tsx` for displaying an animated ship wheel
- Create `src/components/StatCounter.tsx` for animating numerical statistics
- Create `src/components/StatsSection.tsx` to display key statistics
- Configure TypeScript for the project by adding `tsconfig.json`.

### Changed

- Update `.gitignore` to specifically ignore `.env` and `.env.local` instead of a broad `.env*` pattern.
- Refactor `src/app/not-found.tsx` to replace the previous static 404 experience with dynamic `ZoroGame` or `StaticNotFound` components based on user motion preferences, addressing issue #84.
- Refactor `src/app/page.tsx` to introduce new landing page sections (`ContributionHeatmap`, `StatsDashboard`, `TechArsenal`, `CurrentlyBuilding`, `VoyageSail`) and integrate `fetchGitHubData` for dynamic content, removing the previous `StatsSection` and placeholder.
- Simplify `src/components/HeroSection.tsx` by removing mouse tracking, parallax effects, and associated state/hooks.
- Add conditional rendering to `src/components/ShipWheel.tsx` to hide the component on unknown or 404 routes.
- Modify `src/components/ShipWheel.tsx` to hide the component on unknown or 404 routes.
- Update `src/components/ShipWheel.tsx` to replace the "Contact" navigation link with "The One Piece".
- Modify `src/components/ShipWheel.tsx` to display '???' for the "The One Piece" navigation link instead of the first three characters of its label.
- Refactor `src/components/ShipWheel.tsx` to use fixed, cardinal positions for navigation labels instead of dynamic radial positioning.

### Removed

- Remove `src/components/StatCounter.tsx` as it is no longer used.
- Remove `src/components/StatsSection.tsx` as it is no longer used.
- Remove old 404 page implementation, including `WanderingCompass` component and related styling and motion logic from `src/app/not-found.tsx`.
- Remove `src/app/contact/page.tsx`.

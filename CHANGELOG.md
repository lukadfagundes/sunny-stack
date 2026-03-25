# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.1] - 2026-03-24

### Added

- Add file tracing configuration to `next.config.ts` for `/api/docs` route to optimize build output size.
- Add a test case to `tests/api/docs.test.ts` to confirm correct handling of Mermaid diagrams with CRLF line endings.

### Changed

- Adjust padding of the documentation article in `src/app/docs/page.tsx` for improved responsiveness on smaller screens.
- Reduce base font size of the hero section heading in `src/components/HeroSection.tsx` for better visual balance.
- Replace generic `Anchor` icon with specific `Home`, `Briefcase`, `User`, and `BookOpen` icons for navigation items in `src/components/ShipWheel.tsx`.
- Update `NAV_ITEMS` data structure in `src/components/ShipWheel.tsx` to include `LucideIcon` for each navigation item.
- Refactor positioning logic for navigation items in `src/components/ShipWheel.tsx` to use a quarter-arc fanning pattern with an increased radius.
- Remove abbreviated label display for navigation items in `src/components/ShipWheel.tsx`, favoring icon-based representation.
- Update React hook imports in `src/components/landing/ContributionHeatmap.tsx` to include `useCallback` and `useEffect`.
- Implement responsive week display for `ContributionHeatmap.tsx` to show only visible weeks based on container width, using `useCallback` and `useEffect`.
- Update `CurrentlyBuilding.tsx` spyglass frame to use responsive Tailwind classes for width and height, adapting to different screen sizes.
- Adjust horizontal padding for inner content of the `CurrentlyBuilding.tsx` spyglass frame for better mobile layout.
- Decrease base font size of the title within the `CurrentlyBuilding.tsx` spyglass for improved mobile readability.
- Convert brass screw positioning in `CurrentlyBuilding.tsx` from fixed pixel values to percentage-based, ensuring responsiveness and correct scaling.
- Apply responsive sizing to `StatsDashboard.tsx` components using Tailwind classes for better adaptation to screen sizes.
- Update layout for `StatsDashboard.tsx` content to use flexbox for wrapping on small screens and a grid for larger screens.
- Update element selection logic in `tests/components/CurrentlyBuilding.test.tsx` to correctly target the spyglass component for mouse events after styling changes.
- Refactor `tests/components/ShipWheel.test.ts` to verify mobile menu items by checking for `sr-only` links and icon-based links with `aria-labels` instead of abbreviated text labels.

### Fixed

- Update regex in `src/app/api/docs/route.ts` to correctly parse Mermaid code blocks with CRLF line endings.

## [3.0.0] - 2026-03-24

### Added

#### Project Documentation
- Add `README.md` for project overview and setup.
- Add `docs/api/README.md` to document API structure, reflecting `CHANGELOG.md` inclusion in file tree and client-side Mermaid rendering.
- Add `docs/api/endpoint-map.md` to provide a map of API endpoints with simplified labels and left-to-right flowchart direction.
- Add `docs/architecture/component-hierarchy.md` to describe the application's component hierarchy with left-to-right flowchart direction.
- Add `docs/architecture/mvc-flow.md` to explain the Model-View-Controller flow.
- Add `docs/guides/api-development.md` to provide a guide for API development.
- Add `docs/guides/deployment.md` to provide a guide for deployment.
- Add `docs/guides/getting-started.md` to provide a getting started guide.

#### Frontend Component Documentation
- Add `docs/frontend/components/404/ZoroGame.md` to document the 404 page Zoro game component.
- Add `docs/frontend/components/404/game-logic.md` to document the 404 page game logic.
- Add `docs/frontend/components/about/BioSections.md` to document the About page bio sections component.
- Add `docs/frontend/components/about/BlogEntry.md` to document the About page blog entry component.
- Add `docs/frontend/components/about/ContactTable.md` to document the About page contact table component.
- Add `docs/frontend/components/about/DetailsBox.md` to document the About page details box component.
- Add `docs/frontend/components/about/GameStats.md` to document the About page game statistics component.
- Add `docs/frontend/components/about/InterestsTable.md` to document the About page interests table component.
- Add `docs/frontend/components/about/MusicGallery.md` to document the About page music gallery component.
- Add `docs/frontend/components/about/MusicPlayer.md` to document the About page music player component.
- Add `docs/frontend/components/about/NetworkBanner.md` to document the About page network banner component.
- Add `docs/frontend/components/about/PhotoGallery.md` to document the About page photo gallery component.
- Add `docs/frontend/components/about/PostCard.md` to document the About page post card component.
- Add `docs/frontend/components/about/ProfileCard.md` to document the About page profile card component.
- Add `docs/frontend/components/about/SectionHeader.md` to document the About page section header component.
- Add `docs/frontend/components/about/TopEight.md` to document the About page Top Eight component.
- Add `docs/frontend/components/about/VideoCard.md` to document the About page video card component.
- Add `docs/frontend/components/about/VideoGallery.md` to document the About page video gallery component.
- Add `docs/frontend/components/docs/DocNav.md` to document the documentation navigation component with handling of root-level files, deeply nested directories as subgroups, `NavSubgroup` and `NavSubsection` interfaces.
- Add `docs/frontend/components/docs/MarkdownRenderer.md` to document the markdown renderer component with image `src` sanitization, client-side Mermaid diagram rendering via custom HTML elements, and `rehypeRaw` plugin usage.
- Add `docs/frontend/components/docs/MermaidDiagram.md` to document the Mermaid diagram client-side rendering component.
- Add `docs/frontend/components/landing/overview.md` to document the landing page overview.
- Add `docs/frontend/components/navigation/ShipWheel.md` to document the navigation ship wheel component.
- Add `docs/frontend/components/navigation/VoyageSail.md` to document the navigation voyage sail component.

#### Frontend Page Documentation
- Add `docs/frontend/pages/about.md` to document the About page.
- Add `docs/frontend/pages/docs-page.md` to document the documentation page with iteration over subgroups when finding the current document path.
- Add `docs/frontend/pages/home.md` to document the Home page.
- Add `docs/frontend/pages/not-found.md` to document the Not Found page.
- Add `docs/frontend/pages/portfolio.md` to document the Portfolio page.

#### Service Documentation
- Add `docs/services/activity-route.md` to document the activity route service.
- Add `docs/services/bluesky-route.md` to document the Bluesky route service.
- Add `docs/services/data-personal.md` to document personal data handling.
- Add `docs/services/data-projects.md` to document project data handling.
- Add `docs/services/data-types.md` to document data types.
- Add `docs/services/docs-route.md` to document the documentation route service with client-side Mermaid rendering via custom HTML markers and explicit `CHANGELOG.md` path validation.
- Add `docs/services/github-lib.md` to document the GitHub library service.
- Add `docs/services/github-route.md` to document the GitHub route service.
- Add `docs/services/instagram-route.md` to document the Instagram route service.
- Add `docs/services/middleware.md` to document the middleware service.
- Add `docs/services/spotify-token.md` to document the Spotify token service.
- Add `docs/services/spotify-top-track-route.md` to document the Spotify top track route service.
- Add `docs/services/spotify-wrapped-route.md` to document the Spotify Wrapped route service.
- Add `docs/services/steam-achievements-route.md` to document the Steam achievements route service.
- Add `docs/services/steam-route.md` to document the Steam route service.
- Add `docs/services/youtube-route.md` to document the YouTube route service.

#### CI/CD and Configuration
- Add `.github/workflows/quality.yml` to implement code quality checks.
- Add `.github/dependabot.yml` to configure Dependabot for automated dependency updates.
- Add `.github/workflows/ci.yml` to implement Continuous Integration checks using GitHub Actions.
- Add `.github/workflows/deploy.yml` to configure GitHub Actions for application deployment.
- Add `.github/workflows/release.yml` to set up GitHub Actions for automated release management.
- Add `vercel.json` to configure Vercel deployment settings.
- Add `LICENSE` file to specify the `CC-BY-NC-4.0` license.
- Add `license` property to `package.json` to specify the `CC-BY-NC-4.0` license.

#### Build and Test Configuration
- Add `jest.config.ts` for Jest test runner configuration with `moduleNameMapper` configurations for mocking `mermaid` and `rehype-raw` in tests.
- Add `eslint.config.mjs` for ESLint configuration, ignoring the `coverage/**` directory.
- Add `next.config.ts` for Next.js project settings with security headers (`securityHeaders` constant, `poweredByHeader: false`, `headers()` function), and image domains for `avatars.githubusercontent.com`, `i.scdn.co`, `cdn.bsky.app`, `i.ytimg.com`, `*.cdninstagram.com`, and `*.fbcdn.net`.
- Add `postcss.config.mjs` to configure PostCSS for styling.
- Add `tsconfig.json` to configure TypeScript for the project.
- Add `package.json` with project metadata, scripts (`test`, `test:coverage`, `test:watch`), and dependencies including `mermaid`, `rehype-raw`, `react-markdown`, `react-syntax-highlighter`, `remark-gfm`, Jest, and testing-library packages.
- Add `package-lock.json` to lock project dependencies.
- Add `.env.example` to provide a template for environment variables including `STEAM_API_KEY`, `STEAM_ID`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `BLUESKY_HANDLE`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, and `INSTAGRAM_ACCESS_TOKEN`.
- Update `.gitignore` to specifically ignore `.env` and `.env.local`.

#### Assets
- Add `public/Wheel.png` for the ship wheel image asset.
- Add `public/favicon.png` for the application favicon.
- Add `public/ship.png` for the ship image asset.

#### API Routes
- Add `src/app/api/activity/route.ts` to provide real-time user activity status.
- Add `src/app/api/bluesky/route.ts` to fetch Bluesky user posts with `cache: "no-store"` for real-time data.
- Add `src/app/api/docs/route.ts` to serve documentation content, generating `<mermaid-diagram>` custom HTML elements with base64-encoded diagram code, including `CHANGELOG.md` in the file tree, and explicitly allowing `CHANGELOG.md` during path validation.
- Add `src/app/api/github/route.ts` to fetch and expose GitHub profile data.
- Add `src/app/api/instagram/route.ts` to fetch Instagram user media using `Authorization` header with `cache: "no-store"` for real-time data.
- Add `src/app/api/spotify/token.ts` utility for Spotify OAuth token management.
- Add `src/app/api/spotify/top-track/route.ts` to fetch the current top Spotify track with `cache: "no-store"` for real-time data.
- Add `src/app/api/spotify/wrapped/route.ts` for fetching Spotify Wrapped data with `cache: "no-store"` for real-time data.
- Add `src/app/api/steam/achievements/route.ts` to fetch Steam game achievements with input validation to ensure `appid` is numeric.
- Add `src/app/api/steam/route.ts` to fetch a user's Steam game list, excluding specific non-game app IDs.
- Add `src/app/api/youtube/route.ts` to fetch YouTube channel videos with `cache: "no-store"` for real-time data.

#### Pages
- Add `src/app/layout.tsx` to define the root layout structure for the application, including VoyageSail component and `/favicon.png` for the application icon.
- Add `src/app/page.tsx` for the main landing page with ContributionHeatmap, StatsDashboard, TechArsenal, and CurrentlyBuilding sections, `fetchGitHubData` integration, unified `<section>` container, and `relative z-10` positioning.
- Add `src/app/not-found.tsx` to provide a custom 404 Not Found page, dynamically rendering `ZoroGame` or `StaticNotFound` based on user motion preferences with `main` element and `relative z-10` positioning.
- Add `src/app/about/page.tsx` for a comprehensive About page with view state management ("profile"/"pics"/"videos"/"music"/"game"), conditional rendering of PhotoGallery/VideoGallery/MusicGallery/GameStats, `relative z-10` positioning, `selectedGame` state, and imports for GameStats/MusicGallery/PhotoGallery/VideoGallery/SteamGame type.
- Add `src/app/portfolio/page.tsx` for a dynamic portfolio page displaying categorized projects with `relative z-10` positioning.
- Add `src/app/docs/page.tsx` to display documentation using `DocNav` and `MarkdownRenderer` components, 3rd-level subgroup breadcrumbs, `getAutoExpanded` for automatic expansion, and `useMemo` for performance.

#### Global Styles and Middleware
- Add `src/app/globals.css` to implement global styles including `.steam-scrollbar` styles for Steam-themed scrollbar.
- Add `src/middleware.ts` to implement security and request handling logic.

#### Core Components - Landing
- Add `src/components/HeroSection.tsx` for displaying hero content.
- Add `src/components/LetterReveal.tsx` for animated text reveals.
- Add `src/components/ShipWheel.tsx` for displaying an animated ship wheel using `<img>` element with `Wheel.png`, featuring "Docs" navigation link, hidden on unknown/404 routes, fixed cardinal positions for labels, and `LABEL_SHIFT_UP` constant.
- Add `src/components/landing/ContributionHeatmap.tsx` component for displaying GitHub contributions with parchment-themed color palette, CompassRose SVG component, `framer-motion` animations, and defined layout constants (`CELL`, `GAP`, `STEP`).
- Add `src/components/landing/CurrentlyBuilding.tsx` component to highlight current projects with "Through the Spyglass" theme, displaying top three repositories and spyglass-themed `motion.div` with hover interactions.
- Add `src/components/landing/StatsDashboard.tsx` component for displaying developer statistics with animated `Gauge` component, "elastic ease-out" needle sweep, number count-up effect, and `circle` elements with `stroke-dasharray` for progress indication.
- Add `src/components/landing/TechArsenal.tsx` component to showcase technologies used with interactive `CrateItem` component, hover effects, and Y-axis translation animations.
- Add `src/components/landing/VoyageSail.tsx` as a standalone global component for background animation using `<img>` element with `ship.png`, manual scroll tracking with `useMotionValue`, `drop-shadow` and `voyage-ship-bob` animation.

#### Core Components - About Page
- Add `src/components/about/BioSections.tsx` to display biographical sections on the About page.
- Add `src/components/about/BlogEntry.tsx` component for displaying dynamic Bluesky posts with `buildSegments` utility function for rich text parsing, using icons (`Heart`, `MessageCircle`, `Repeat2`, `CloudSun`), `Image` component, and `BlueskyPost`/`BlueskyFacet` types.
- Add `src/components/about/ContactTable.tsx` component to display social media links (Instagram, X, Bluesky, YouTube, GitHub, Email) using `contactLinks` from personal.ts, `COLOR_MAP` for styling, and icons (`Instagram`, `CloudSun`, `XIcon`, `Youtube`, `Github`).
- Add `src/components/about/DetailsBox.tsx` component for showcasing various personal details on the About page.
- Add `src/components/about/GameStats.tsx` component to display detailed statistics for a selected Steam game.
- Add `src/components/about/InterestsTable.tsx` component to list interests in a table format with dynamic Spotify data fetching for "Music" row, static "Heroes" values, `badgeColors` constant, and updated grid layout.
- Add `src/components/about/MusicGallery.tsx` component to display a collection of music.
- Add `src/components/about/MusicPlayer.tsx` component to dynamically fetch and display the user's top Spotify track with `onViewMusic` prop and `sandbox` iframe attribute for enhanced security.
- Add `src/components/about/NetworkBanner.tsx` component to display a network banner on the About page.
- Add `src/components/about/PhotoGallery.tsx` component for displaying Instagram media posts.
- Add `src/components/about/PostCard.tsx` component for rendering individual Instagram posts within the gallery.
- Add `src/components/about/ProfileCard.tsx` component to present a user profile card with dynamic GitHub profile data and activity status fetching, calculated age, `onViewPics`, `onViewVideos`, `onViewMusic` button props, and `Image` component for GitHub avatar.
- Add `src/components/about/SectionHeader.tsx` component for consistent section titling across the About page.
- Add `src/components/about/TopEight.tsx` component to fetch and display Steam games from `/api/steam` API with `onViewGame` prop, `games`/`error`/`loading` states.
- Add `src/components/about/VideoCard.tsx` component for displaying individual YouTube video thumbnails and titles with `sandbox` iframe attribute for enhanced security.
- Add `src/components/about/VideoGallery.tsx` component for displaying a collection of YouTube videos.

#### Core Components - Portfolio
- Add `src/components/portfolio/CategorySection.tsx` to group and display projects by category.
- Add `src/components/portfolio/ProjectCard.tsx` to display individual project details within the portfolio.

#### Core Components - Documentation
- Add `src/components/docs/DocNav.tsx` component to manage documentation navigation and file loading, handling `CHANGELOG.md` as a root-level file, collecting 3rd-level subgroups, and computing expanded sections/subsections.
- Add `src/components/docs/MarkdownRenderer.tsx` component to handle rendering of markdown content with `rehypeRaw` and `MermaidDiagram` imports, custom rendering for `mermaid-diagram` HTML elements, and image src sanitization.
- Add `src/components/docs/MermaidDiagram.tsx` component to render Mermaid diagrams client-side.

#### Core Components - 404 Game
- Add `src/components/404/DPad.tsx` component for game input controls.
- Add `src/components/404/GameBoard.tsx` component to render the game board.
- Add `src/components/404/GameHUD.tsx` component to display game-related information.
- Add `src/components/404/GameTile.tsx` component to represent individual game tiles.
- Add `src/components/404/StaticNotFound.tsx` component for a simplified 404 page experience.
- Add `src/components/404/WinCelebration.tsx` component to display win animations.
- Add `src/components/404/ZoroGame.tsx` as the main interactive 404 game component with title, description, and fixed-height top spacer.
- Add `src/components/404/grid.ts` utility file for game grid logic.
- Add `src/components/404/quotes.ts` utility file for game-related quotes.
- Add `src/components/404/reducer.ts` for managing game state logic.
- Add `src/components/404/types.ts` for defining game-related TypeScript types.
- Add `src/components/404/useGameInput.ts` custom hook for handling game input with `disabled` parameter to conditionally prevent input handling.

#### Library and Data
- Add `src/lib/github.ts` utility file for fetching GitHub data including `avatarUrl` property in `GitHubProfile` type and `cache: "no-store"` for real-time data.
- Add `src/lib/data/personal.ts` to manage and retrieve personal data with real values for "Status", "Pets", "Comfort Movie", "Zodiac Sign", "General" (including "D&D"), "Movies", "Television", "Books", static "Heroes" values, `BIRTHDATE` constant, `calculateAge` utility function, `SocialLinkType` excluding "twitch" and "linkedin", and `contactLinks` array with Instagram/X/Bluesky/YouTube/GitHub/Email.
- Add `src/lib/data/projects.ts` to manage and retrieve project data, including `getProjectsByCategory`.
- Add `src/lib/data/types.ts` to define project-related TypeScript types, including `ProjectCategory`.

#### Test Files - API Routes
- Add `tests/api/activity.test.ts` for testing the activity status API route.
- Add `tests/api/bluesky.test.ts` for testing the Bluesky API endpoint.
- Add `tests/api/docs.test.ts` for the documentation API route using virtual filesystem (`VIRTUAL_FILES` and `virtualReaddirSync`) for robust testing, asserting `<mermaid-diagram>` custom HTML elements with `data-chart` attributes.
- Add `tests/api/github.test.ts` for testing the GitHub profile API route, verifying the `avatarUrl` property.
- Add `tests/api/instagram.test.ts` for testing the Instagram media API route, verifying the `Authorization` header usage.
- Add `tests/api/spotify-top-track.test.ts` for the Spotify top track endpoint.
- Add `tests/api/spotify-wrapped.test.ts` for the Spotify Wrapped endpoint.
- Add `tests/api/steam.test.ts` for testing the Steam API routes, verifying numeric `appid` validation and exclusion of specific non-game app IDs.
- Add `tests/api/youtube.test.ts` for the YouTube API route.

#### Test Files - Components
- Add `tests/components/CategorySection.test.tsx` for testing the `CategorySection` component.
- Add `tests/components/ContributionHeatmap.test.tsx` for testing the `ContributionHeatmap` component.
- Add `tests/components/CurrentlyBuilding.test.tsx` for testing the `CurrentlyBuilding` component.
- Add `tests/components/DPad.test.tsx` for testing the `DPad` component.
- Add `tests/components/GameBoard.test.tsx` for testing the `GameBoard` component.
- Add `tests/components/GameHUD.test.tsx` for testing the `GameHUD` component.
- Add `tests/components/GameTile.test.tsx` for testing the `GameTile` component.
- Add `tests/components/HeroSection.test.tsx` for testing the `HeroSection` component.
- Add `tests/components/LetterReveal.test.tsx` for testing the `LetterReveal` component.
- Add `tests/components/MusicGallery.test.ts` for testing the `MusicGallery` component.
- Add `tests/components/MusicPlayer.test.tsx` for testing the `MusicPlayer` component with dynamic content loading, Spotify embed rendering, and `sandbox` attribute verification.
- Add `tests/components/PhotoGallery.test.tsx` for testing the `PhotoGallery` component.
- Add `tests/components/PostCard.test.tsx` for testing the `PostCard` component.
- Add `tests/components/ProjectCard.test.tsx` for testing the `ProjectCard` component.
- Add `tests/components/ShipWheel.test.tsx` for testing the `ShipWheel` component, verifying `<img>` element with `src="/wheel.png"`, "Docs" navigation link, and center hub click handler.
- Add `tests/components/StaticNotFound.test.tsx` for testing the `StaticNotFound` component.
- Add `tests/components/StatsDashboard.test.tsx` for testing the `StatsDashboard` component.
- Add `tests/components/TechArsenal.test.tsx` for testing the `TechArsenal` component.
- Add `tests/components/VideoCard.test.tsx` for testing the `VideoCard` component, verifying `sandbox` attribute.
- Add `tests/components/VideoGallery.test.tsx` for testing the `VideoGallery` component.
- Add `tests/components/VoyageSail.test.tsx` for testing the `VoyageSail` component with `<img>` element with `src="/ship.png"` and `prefers-reduced-motion` behavior.
- Add `tests/components/WinCelebration.test.tsx` for testing the `WinCelebration` component.
- Add `tests/components/ZoroGame.test.tsx` for testing the `ZoroGame` component with support for overriding state and `createInitialState` import.
- Add `tests/components/about-edges.test.tsx` for testing the `AboutEdges` component.
- Add `tests/components/about.test.tsx` for testing the About component with tests for dynamic age/gender/location/activity status in `ProfileCard`, social links, Spotify genre badges, `onViewPics`/`onViewMusic`/`onViewVideos`/`onViewGame` callbacks, static "Heroes" values, Bluesky post rendering with rich text links/hashtags/mention facets/external embeds, and `global.fetch` mocking.
- Add `tests/components/docs.test.tsx` for testing the documentation page component with error display tests for initial content fetch and file navigation fetch failures.
- Add `tests/components/docs/MarkdownRenderer.test.tsx` for testing the `MarkdownRenderer` component with rendering of `MermaidDiagram` from `mermaid-diagram` elements and handling missing `data-chart` attributes.

#### Test Files - 404 Game Logic
- Add `tests/404/grid.test.ts` for testing 404 game grid logic.
- Add `tests/404/quotes.test.ts` for testing 404 game quotes.
- Add `tests/404/reducer.test.ts` for testing 404 game reducer logic.
- Add `tests/404/useGameInput.test.ts` for testing the `useGameInput` hook.

#### Test Files - Pages and Library
- Add `tests/pages/about.test.tsx` for testing the About page with view switching tests for profile/music gallery/video gallery/photo gallery and `global.fetch` mocking.
- Add `tests/pages/not-found.test.tsx` for testing the 404 Not Found page.
- Add `tests/pages/portfolio.test.tsx` for testing the Portfolio page.
- Add `tests/lib/github.test.ts` for testing GitHub API utility functions, verifying the `avatarUrl` property.
- Add `tests/lib/projects.test.ts` for testing project data utility functions.

#### Test Files - Setup and Helpers
- Add `tests/setup.ts` for Jest test environment setup with `TextEncoder` and `TextDecoder` polyfills for jsdom environment compatibility.
- Add `tests/helpers/mocks.ts` to provide mock data and functions for testing.
- Add `tests/helpers/__mocks__/mermaid.ts` to mock the `mermaid` library for testing purposes.
- Add `tests/helpers/__mocks__/rehype-raw.ts` to mock the `rehype-raw` plugin for testing purposes.
- Add `tests/middleware.test.ts` for testing the middleware.

'''

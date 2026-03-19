# sunny-stack V3 — Product Requirements Document

**Version:** 0.3 (Draft)
**Last Updated:** 2026-03-19
**Status:** PLANNING
**Branch:** `v3` (to be created)
**Production:** V2 remains live on `main` until V3 launch

---

## Vision

sunny-stack V3 is a ground-up rebuild of the portfolio as a **living, interactive experience**. The site doesn't describe what Luka can build — it demonstrates it. Every page is its own interactive world. Every interaction is intentional. The entire experience is the portfolio.

**Tagline concept:** "The site IS the portfolio."

---

## Design Philosophy

### "Thousand Sunny at Sunset"

The visual identity draws from the Thousand Sunny — warm, inviting, adventurous — but at golden hour. Dark-warm tones throughout, no light mode, no user-configurable themes. One cohesive aesthetic.

**Color Palette (Starter — subject to iteration):**

| Token | Hex | Usage |
|-------|-----|-------|
| `sunny.bg` | `#1A1209` | Page background — near-black with warm brown undertone |
| `sunny.surface` | `#2A1F14` | Cards, panels, elevated surfaces |
| `sunny.surfaceLight` | `#3D2E1F` | Hover states, secondary surfaces, borders |
| `sunny.gold` | `#F0B429` | Primary accent — headers, highlights, interactive elements |
| `sunny.goldMuted` | `#B8860B` | Subtle gold — borders, secondary highlights |
| `sunny.red` | `#DC2626` | Secondary accent — carried from V2 |
| `sunny.darkRed` | `#991B1B` | Deep red — hover states, emphasis |
| `sunny.cream` | `#F5E6D3` | Primary text color — warm off-white |
| `sunny.creamMuted` | `#C4A882` | Secondary text — labels, captions, muted content |
| `sunny.wood` | `#6B4226` | Decorative — borders, dividers, nav wood tones |
| `sunny.woodLight` | `#8B5E3C` | Lighter wood — hover accents on nav elements |

**No pure black (`#000`), no pure white (`#FFF`), no cool grays.** Always dark-warm. No light/dark toggle. This IS the design.

**V2 colors retired:** `sunny.sky`, `sunny.ocean`, `sunny.orange` — these were cool/bright tones that don't fit the dark-warm aesthetic. `sunny.brown` (`#92400E`) replaced by the wood tones above.

### Typography

Each page has its own typographic personality. Fonts are loaded via `next/font` for optimal performance.

| Page | Font Family | Rationale |
|------|-------------|-----------|
| **About** (`/about`) | **Verdana** (system font) | Authentic MySpace DNA — no download needed, instant load |
| **Landing** (`/`) | **Playfair Display** (serif) | Elegant, editorial feel for the first impression. Pairs with the warm-dark theme. |
| **Portfolio** (`/portfolio`) | **Space Grotesk** (sans-serif) | Technical, modern, slightly geometric — fits project showcase energy |
| **Contact** (`/contact`) | **Space Grotesk** (sans-serif) | Consistent with portfolio — clean and readable for form inputs |
| **Navigation / Global** | **Inter** (sans-serif) | Neutral, highly readable at small sizes — nav labels, footer, meta text |

**Code snippets / monospace:** JetBrains Mono (carried from V2)

Fonts can be swapped during build — these are starting points, not final.

### Responsive Strategy

Mobile-first design. All layouts must work cleanly from 320px to ultrawide.

| Breakpoint | Tailwind | Behavior |
|------------|----------|----------|
| Base | `<sm` (< 640px) | Single column, stacked layouts, touch-optimized tap targets (min 44px) |
| Small | `sm` (640px+) | Minor spacing adjustments |
| Medium | `md` (768px+) | Two-column layouts activate (About page, portfolio grid) |
| Large | `lg` (1024px+) | Full desktop layouts, hover interactions enabled, ship's wheel visible |
| XL | `xl` (1280px+) | Max-width containers, extra breathing room |

**Key rules:**
- Ship's wheel nav: visible as wheel on `lg+`, collapses to radial menu icon below `lg`
- About page: two-column on `md+`, single stacked column below
- Portfolio cards: 1 column on base, 2 on `md`, 3 on `lg`
- All interactive hover effects gracefully degrade on touch (use `@media (hover: hover)`)
- No horizontal scroll at any viewport width

### Interaction Philosophy

- **Scroll-driven animations:** Elements reveal and animate as users scroll
- **Micro-interactions:** Hover effects, click responses, subtle feedback on every interactive element
- **Data visualizations:** Charts, graphs, skill maps that respond to user interaction
- **Purposeful motion:** Every animation serves the experience — no gratuitous movement
- **Performance-first:** Animations that don't compromise load times or accessibility

---

## Tech Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (primary), possibly GSAP for complex sequences
- **Icons:** Lucide React

### Integrations
- **Resend** — Contact form email delivery (single API route)

### What's Gone (from V2)
- No database / No Prisma
- No Discord bot
- No monitoring system
- No admin dashboard
- No quote wizard
- No resume page / PDF generator
- No time tracking
- No Google API integration
- No Rollbar / external error tracking
- No 27 API routes (replaced with 2-3 max)

### Development
- **Testing:** Jest
- **Linting:** ESLint (flat config)
- **Type checking:** TypeScript strict mode
- **Deployment:** Vercel

---

## Site Architecture

### 4 Pages — Each Its Own World

```
/              → Landing Page (first impression, capabilities showcase)
/portfolio     → Portfolio (interactive project showcase)
/about         → About Me (MySpace-inspired personal page)
/contact       → Contact (simple, personality-infused form)
```

### Persistent Elements
- **Ship's Wheel Navigation** — interactive nav element present on all pages
- **Zoro Easter Egg** — activated by pressing the center of the ship's wheel
- **Footer / ambient element** — TBD, something that ties the Sunny theme together

---

## Page Specifications

### 1. Landing Page (`/`)

**Purpose:** First impression. Immediately demonstrate capability through the experience itself.

**Core elements:**
- Animated hero with personality (not a stock "Welcome to my portfolio")
- Dynamic stats derived from project data (auto-updating):
  - X projects built
  - Y technologies used
  - Z duration of development experience
- Scroll-driven content reveals
- Clear visual path to other pages
- Sets the tone for the entire experience

**Design Direction: "The Horizon"**
A full-viewport hero with a warm gradient sky (dark browns to golden hour amber) and a subtle animated horizon line. Luka's name and title animate in with a letter-reveal effect. Below, animated stat counters (projects built, technologies used, dev experience duration) count up as they scroll into view. The horizon line shifts subtly with mouse movement (parallax), creating depth without being heavy.

**Remaining questions:**
- [ ] How do stats animate in? (Count-up on scroll-into-view is the leading option)
- [ ] What's below the fold? Featured projects? Skills overview? Journey teaser?

---

### 2. Portfolio (`/portfolio`)

**Purpose:** Project showcase reimagined. Not cards with text — interactive experiences.

**Core elements:**
- Three project categories with distinct visual identities:
  - **Professional** (Trinity SDK, Cola Records, Rinoa)
  - **Personal** (Hytale Server Manager, Bwaincell, Stilltide, Spotify Rainmeter)
  - **Contributions** (Reactive Resume)
- Interactive project cards with depth and animation
- Expandable detail views (architecture diagrams, feature breakdowns, tech stacks)
- Tech stack visualizations
- Live links to GitHub, downloads, live apps
- Each project feels like opening a chapter

**Data source:** Portfolio project data (carried from V2 `projects-data.tsx` structure)

**Design Direction: "Chapter Cards"**
Each project is a card that behaves like opening a chapter of a book:

- **Closed state:** Card shows project name, a subtle gradient in the project's accent color, tech stack icons, and a one-line tagline. Cards have a slight 3D tilt on hover (CSS perspective transform).
- **Opening:** Clicking a card expands it inline (not a modal) — it pushes siblings aside and reveals the full project detail. The expansion animates smoothly with Framer Motion's `layoutId`.
- **Open state:** Shows full description, architecture highlights, feature breakdown, tech stack as interactive pills (hover for context), and links (GitHub, live app, download).
- **Category differentiation:** Professional projects get gold accent borders, Personal projects get warm red, Contributions get a muted cream/brown. Each category section has a distinct header.

**Remaining questions:**
- [ ] Do we show architecture diagrams? Screenshots? Code snippets?
- [ ] Interactive tech stack pills — what detail appears on hover?

---

### 3. About Me (`/about`) — "The MySpace Page"

**Purpose:** Personality centerpiece. Spirit of MySpace — deeply personal, self-expression-first — in a modern interactive wrapper.

**Design Direction:** A modern interpretation of MySpace's classic profile layout (2005-2008 era). Same structural DNA, rebuilt with modern styling and the V3 dark-warm theme. Starting as a static page — no backend, no API calls. Content is hardcoded data.

#### Classic MySpace Layout Reference

The original MySpace profile used a two-column layout:

**Left Column (~narrow, identity):**
- Profile picture (square, bordered)
- Display name + tagline ("Luka's headline")
- Details box: Online status, mood, age, location
- Contact table: 8 action links (Send Message, Add to Friends, etc.)
- Music player (embedded below profile)

**Right Column (~wide, content):**
- **"About Me"** blurb — free-form bio text
- **"Who I'd Like to Meet"** blurb — secondary text section
- **Interests table** — 2-column table (label | value) with rows: General, Music, Movies, Television, Books, Heroes
- **Friends / Top 8** — grid of 4x2 friend thumbnails with names
- **Comments wall** — chronological list of friend comments with avatars

**Visual styling:** Orange section headers (`.orangetext15`), white content backgrounds, light gray borders, table-based boxy layout, Verdana font.

#### V3 Modern Adaptation

Translating MySpace sections to the V3 dark-warm aesthetic:

**Left Column (Profile Identity):**
- Profile image with warm gold border (replaces MySpace's blue border)
- Display name: "Luka Fagundes"
- Tagline/headline (e.g., "Full Stack Developer & Builder of Things")
- Details box (dark card with warm accents):
  - Status: "Online" / mood indicator
  - Location: Eureka, CA
  - Coding since: 2025
  - Favorite framework: Next.js (or rotates)
- Contact table (styled as icon buttons):
  - GitHub, LinkedIn, Email, Portfolio links
  - Replaces MySpace's "Send Message / Add to Friends" with modern equivalents
- Music player area: Static placeholder for now — just the visual shell of a player widget styled into the page (album art square, track name, artist, progress bar). No API, no audio. Content can be iterated on later.

**Right Column (Content):**
- **"About Me"** section — bio text with warm section header (gold instead of MySpace orange)
- **"Who I'd Like to Meet"** section — repurposed as "What I'm Looking For" (work interests, collaboration style, ideal team)
- **Interests table** — 2-column grid with dark-warm styling:
  - General: Self-taught developer, equipment sales background...
  - Music: [personal taste]
  - Movies/TV: [personal taste]
  - Books: [personal taste]
  - Heroes: [people/devs who inspire]
  - Technologies: TypeScript, React, Next.js, Python...
- **Top 8** — 4x2 grid of technology/tool icons with names (replaces friend avatars with tech logos). Hover reveals a short "why I love this" tooltip.
- **Comments wall** — Static curated entries styled as MySpace wall comments. Each has an avatar, name, timestamp, and message. Placeholder content for now — can be made interactive later.

#### Implementation Notes (First Pass)
- Pure static page — all content lives in a data file (`lib/data/personal.ts`)
- Two-column CSS Grid layout (responsive: stacks on mobile)
- Section headers use warm gold text on dark backgrounds (not the literal MySpace orange)
- No API calls, no Spotify, no live data — just the bones
- Music player is a visual-only component (album art, text, fake progress bar)
- Comments are hardcoded objects rendered as styled cards

**Remaining questions:**
- [ ] Profile image — real photo? Illustrated avatar? Placeholder for now?
- [ ] Top 8 content — technologies? tools? mix of both? favorite projects?
- [ ] Comments wall — what placeholder content? Developer-themed jokes? Fake friend comments?

---

### 4. Contact (`/contact`)

**Purpose:** Simple way to reach out. Clean, personality-infused.

**Core elements:**
- Three fields: name, email, message
- Submit sends email via Resend (single API route)
- Confirmation animation on submit
- Alternative contact methods: email, LinkedIn, GitHub links
- Some interactive flair to make a basic form feel special

**Open questions:**
- [ ] Visual concept for the form? (Message in a bottle? Terminal-style? Classic card?)
- [ ] Success state — what happens after submit? Animation? Message? Redirect?
- [ ] Do we show estimated response time?

---

## Navigation — The Ship's Wheel ("The Helm")

**Concept:** The primary navigation is a ship's wheel element, always accessible.

**Design Direction:**
- **Desktop:** Fixed position, bottom-right corner. ~80px diameter SVG. Semi-transparent when idle, full opacity on hover. Floats above content with a subtle warm shadow.
- **4 spokes** map to the 4 pages (Home, Portfolio, About, Contact). On hover, spoke labels appear with warm-gold text.
- **Page transitions:** The wheel rotates to the "heading" of the target page (e.g., 90deg clockwise going Home to Portfolio, 180deg for Home to About) before the page transition fires.
- **Visual style:** Stylized/minimal — clean SVG with warm wood tones and gold spoke tips. Subtle wood grain texture, not photorealistic.
- **Mobile:** Collapses to a small anchor/helm icon that expands into a radial menu on tap — 4 options fan out like a compass rose.
- **Easter egg:** Pressing the center hub (unmarked, no visual hint) triggers the Zoro easter egg.

**Remaining questions:**
- [ ] How does the Zoro easter egg manifest? Current V2 behavior? Enhanced? "Lost directions" mode where nav labels scramble?
- [ ] Exact spoke-to-page mapping and rotation angles

---

## Data Architecture

### What Carries Forward (Conceptually)
The project data structure from V2's `projects-data.tsx` is valuable. In V3 it lives as static data files (no database). V2's data files contain embedded JSX (React components in descriptions) — V3 data must be **pure TypeScript objects** with no React imports, so data files can be consumed by any component without side effects.

```
lib/
  data/
    projects.ts          — All portfolio project data (plain TS objects, no JSX)
    skills.ts            — Skills/tech categorization (from V2 skill-categories.ts)
    personal.ts          — About me content, interests, fun facts, MySpace profile data
```

**Migration approach:** Extract V2 project data into clean interfaces during build. Strip JSX from descriptions, convert to plain strings or markdown. Define `ProjectData` interface fresh — don't import V2 types.

### API Routes (Minimal)
```
app/api/
  contact/route.ts       — Contact form submission (Resend)
```

### No Database
- All content is static TypeScript files
- No Prisma, no PostgreSQL, no migrations
- Contact form sends email directly via Resend (stateless)

---

## Zoro Easter Egg

**Trigger:** Press the center of the ship's wheel navigation element.

**Current V2 behavior:** [TBD — need to audit current implementation]

**V3 considerations:**
- [ ] Keep current behavior or enhance?
- [ ] Should the trigger have a subtle visual hint (or completely hidden)?
- [ ] Multi-stage? (First press = hint, specific pattern = full reveal?)

---

## Performance & Accessibility

### Performance Targets
- **Lighthouse Performance:** 90+
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1
- **Animations:** 60fps, GPU-accelerated where possible
- **Bundle size:** Monitor carefully — Framer Motion adds weight

### Accessibility
- All animations respect `prefers-reduced-motion`
- Keyboard navigation for all interactive elements
- Semantic HTML structure
- Proper contrast ratios (especially important with dark theme)
- Screen reader support for dynamic content
- Ship's wheel nav must have keyboard-accessible alternative

---

## Migration Strategy

### Branch Strategy
1. Create `v3` branch from `main`
2. Remove everything except `.claude/` directory
3. Fresh Next.js setup with Tailwind + Framer Motion
4. Build pages incrementally
5. V2 stays live on `main` (production) throughout
6. Merge `v3` → `main` when ready for launch

### What to Audit from V2 (on `main`)
- `app/portfolio/projects-data.tsx` — project data structure
- `lib/resume/skill-categories.ts` — tech categorization logic
- `tailwind.config.ts` — color palette definitions
- Zoro easter egg implementation (location TBD)
- `components/Navigation.tsx` — current nav structure for reference

---

## Open Decisions

### Resolved
1. ~~**Hero concept**~~ — "The Horizon": warm gradient sky, letter-reveal name, parallax horizon, scroll-triggered stat counters
2. ~~**Ship's wheel design**~~ — "The Helm": stylized SVG, bottom-right fixed, 4 spokes = 4 pages, rotates on transition, radial menu on mobile
3. ~~**MySpace about page layout**~~ — Classic two-column MySpace structure adapted to dark-warm theme (see About page spec)
4. ~~**Spotify integration**~~ — REMOVED. Music player is visual-only shell for now. Can add Spotify API later.
5. ~~**Portfolio card interaction**~~ — "Chapter Cards": inline expansion, 3D tilt hover, category color coding (gold/red/cream)
6. ~~**Comments section**~~ — DEFERRED. Static placeholder comments styled as MySpace wall posts. No backend needed initially.
7. ~~**Color palette**~~ — 11-token dark-warm palette defined (see Design Philosophy)
8. ~~**Typography**~~ — Per-page font strategy: Verdana (About/MySpace), Playfair Display (Landing), Space Grotesk (Portfolio/Contact), Inter (Nav/Global)
9. ~~**Responsive strategy**~~ — Mobile-first, Tailwind breakpoints, touch-friendly degradation
10. ~~**Project data format**~~ — Pure TS objects, no JSX. Clean interfaces defined fresh for V3.

### Medium Priority (Can Evolve During Build)
7. **Contact form personality** — Visual concept for the form
8. **Scroll animation strategy** — What elements animate and how?
9. **Page transition animations** — How do pages flow into each other?
10. **Mobile experience** — How do interactive elements adapt?

### Low Priority (Polish Phase)
11. **Footer design** — Ambient Sunny-themed element?
12. **Loading states** — Skeleton? Animation? Splash?
13. **404 page** — On-theme error page
14. **SEO / meta tags** — Open Graph, Twitter cards
15. **Analytics** — Vercel Analytics? Minimal tracking?

---

## Timeline

No time estimates. Quality and completeness are the only metrics. Each page ships when it's right.

**Suggested build order:**
1. Foundation (branch setup, theme, navigation shell)
2. Landing page (sets the visual tone for everything)
3. Portfolio page (core content)
4. About page (MySpace personality showcase)
5. Contact page (simplest, good to finish on)
6. Polish pass (animations, transitions, easter egg refinement)

---

## Success Criteria

V3 is successful when:
- [ ] A visitor's first reaction is "this person clearly knows what they're doing"
- [ ] The site itself demonstrates full-stack capability without saying "I'm a full-stack developer"
- [ ] Every page has at least one "oh that's cool" moment
- [ ] The MySpace about page makes people smile
- [ ] The Zoro easter egg delights those who find it
- [ ] Performance stays above 90 Lighthouse despite heavy interactivity
- [ ] The site feels cohesive — all 4 pages belong to the same world

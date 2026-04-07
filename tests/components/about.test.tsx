import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ProfileCard from "@/components/about/ProfileCard";
import ContactTable from "@/components/about/ContactTable";
import MusicPlayer from "@/components/about/MusicPlayer";
import DetailsBox from "@/components/about/DetailsBox";
import NetworkBanner from "@/components/about/NetworkBanner";
import BlogEntry from "@/components/about/BlogEntry";
import BioSections from "@/components/about/BioSections";
import InterestsTable from "@/components/about/InterestsTable";
import TopEight from "@/components/about/TopEight";
import GameStats from "@/components/about/GameStats";
import SectionHeader from "@/components/about/SectionHeader";

describe("SectionHeader", () => {
  it("renders the title text", () => {
    render(<SectionHeader title="Test Header" />);
    expect(screen.getByText("Test Header")).toBeInTheDocument();
  });
});

describe("ProfileCard", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as jest.Mock;
  });

  it("renders the profile name", () => {
    render(<ProfileCard />);
    expect(screen.getByText("Luka")).toBeInTheDocument();
  });

  it("renders gender as He/Him", () => {
    render(<ProfileCard />);
    expect(screen.getByText("He/Him")).toBeInTheDocument();
  });

  it("renders dynamically calculated age", () => {
    render(<ProfileCard />);
    expect(screen.getByText(/\d+ years old/)).toBeInTheDocument();
  });

  it("renders CA as location", () => {
    render(<ProfileCard />);
    expect(screen.getByText("CA")).toBeInTheDocument();
  });

  it("renders offline status by default", () => {
    render(<ProfileCard />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders online status when activity API returns isOnline=true", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url === "/api/activity") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lastActivityAt: new Date().toISOString(), isOnline: true }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    }) as jest.Mock;

    render(<ProfileCard />);

    await waitFor(() => {
      expect(screen.getByText("Online Now!")).toBeInTheDocument();
    });
  });

  it("renders last login from activity API", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url === "/api/activity") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lastActivityAt: "2026-03-20T10:00:00Z", isOnline: false }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    }) as jest.Mock;

    render(<ProfileCard />);

    await waitFor(() => {
      expect(screen.getByText(/Last Login: 3\/20\/2026/)).toBeInTheDocument();
    });
  });

  it("renders last login", () => {
    render(<ProfileCard />);
    expect(screen.getByText(/Last Login/)).toBeInTheDocument();
  });

  it("shows placeholder icon when no avatar available", () => {
    render(<ProfileCard />);
    expect(screen.getByText("NO PHOTO")).toBeInTheDocument();
  });

  it("renders avatar image after fetching from GitHub API", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url === "/api/github") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              avatarUrl: "https://avatars.githubusercontent.com/u/12345?s=200&v=4",
              name: "Luka Fagundes",
              bio: null,
              location: null,
              lastPushedAt: null,
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    }) as jest.Mock;

    render(<ProfileCard />);

    await waitFor(() => {
      const img = document.querySelector("img");
      expect(img).toBeInTheDocument();
    });

    const img = document.querySelector("img");
    expect(img?.alt).toBe("Luka's profile photo");
  });

  it("shows placeholder icon when API returns null", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as jest.Mock;

    render(<ProfileCard />);

    // Wait for fetch to settle
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByText("NO PHOTO")).toBeInTheDocument();
  });

  it("shows placeholder icon when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("fail"))
    ) as jest.Mock;

    render(<ProfileCard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByText("NO PHOTO")).toBeInTheDocument();
  });

  it("calls onViewPics when Pics button is clicked", () => {
    const onViewPics = jest.fn();
    render(<ProfileCard onViewPics={onViewPics} />);
    fireEvent.click(screen.getByText("Pics"));
    expect(onViewPics).toHaveBeenCalledTimes(1);
  });

  it("renders Pics as a button element", () => {
    render(<ProfileCard />);
    const picsButton = screen.getByText("Pics");
    expect(picsButton.tagName).toBe("BUTTON");
  });

  it("calls onViewVideos when Videos button is clicked", () => {
    const onViewVideos = jest.fn();
    render(<ProfileCard onViewVideos={onViewVideos} />);
    fireEvent.click(screen.getByText("Videos"));
    expect(onViewVideos).toHaveBeenCalledTimes(1);
  });

  it("renders Videos as a button element", () => {
    render(<ProfileCard />);
    const videosButton = screen.getByText("Videos");
    expect(videosButton.tagName).toBe("BUTTON");
  });
});

describe("ContactTable", () => {
  it("renders all 6 social links", () => {
    render(<ContactTable />);
    const labels = ["Instagram", "X", "Bluesky", "YouTube", "GitHub", "Email"];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("renders the section header", () => {
    render(<ContactTable />);
    expect(screen.getByText(/Contacting/)).toBeInTheDocument();
  });

  it("renders links with target _blank", () => {
    render(<ContactTable />);
    const link = screen.getByText("GitHub").closest("a");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders email link without target _blank", () => {
    render(<ContactTable />);
    const emailLink = screen.getByText("Email").closest("a");
    expect(emailLink).toHaveAttribute("href", "mailto:luka@sunny-stack.com");
    expect(emailLink).not.toHaveAttribute("target");
  });
});

describe("MusicPlayer", () => {
  it("shows loading state initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    render(<MusicPlayer />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Spotify embed after fetch", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "abc",
            name: "My Song",
            artist: "My Artist",
            albumName: "My Album",
            albumImageUrl: "https://i.scdn.co/image/test.jpg",
            spotifyUrl: "https://open.spotify.com/track/abc",
          }),
      })
    ) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      expect(document.querySelector("iframe")).toBeInTheDocument();
    });
    const iframe = document.querySelector("iframe");
    expect(iframe?.src).toContain("open.spotify.com/embed/track/abc");
  });
});

describe("DetailsBox", () => {
  it("renders all detail rows", () => {
    render(<DetailsBox />);
    expect(screen.getByText(/^Status/)).toBeInTheDocument();
    expect(screen.getByText(/^Pets/)).toBeInTheDocument();
    expect(screen.getByText(/^Comfort Movie/)).toBeInTheDocument();
    expect(screen.getByText(/^Zodiac Sign/)).toBeInTheDocument();
  });

  it("renders the section header", () => {
    render(<DetailsBox />);
    expect(screen.getByText(/Details/)).toBeInTheDocument();
  });
});

describe("NetworkBanner", () => {
  it("renders the professional blurb", () => {
    render(<NetworkBanner />);
    expect(
      screen.getByText(/Self-taught full stack developer/)
    ).toBeInTheDocument();
  });
});

describe("BlogEntry", () => {
  it("renders the blog section header", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    render(<BlogEntry />);
    expect(screen.getByText(/Latest Blog Entry/)).toBeInTheDocument();
  });

  it("shows loading skeletons initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    render(<BlogEntry />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders post text with rich text links after loading", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            text: "Check out https://example.com #dev",
            facets: [
              {
                index: { byteStart: 10, byteEnd: 29 },
                features: [
                  { $type: "app.bsky.richtext.facet#link", uri: "https://example.com" },
                ],
              },
              {
                index: { byteStart: 30, byteEnd: 34 },
                features: [
                  { $type: "app.bsky.richtext.facet#tag", tag: "dev" },
                ],
              },
            ],
            embed: null,
            likeCount: 15,
            replyCount: 3,
            repostCount: 7,
            permalink: "https://bsky.app/profile/test/post/abc",
            createdAt: "2026-03-20T12:00:00.000Z",
          }),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByText("https://example.com")).toBeInTheDocument();
    });
    // Link should be rendered as an anchor
    const link = screen.getByText("https://example.com");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://example.com");
    // Hashtag should be rendered as an anchor
    const tag = screen.getByText("#dev");
    expect(tag.tagName).toBe("A");
    // Engagement counts
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("fail"))) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByText("Could not load latest post.")).toBeInTheDocument();
    });
  });

  it("shows empty state when no post returned", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByText("No posts to display.")).toBeInTheDocument();
    });
  });

  it("renders mention facet as profile link", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            text: "Hello @someone there",
            facets: [
              {
                index: { byteStart: 6, byteEnd: 14 },
                features: [
                  { $type: "app.bsky.richtext.facet#mention", did: "did:plc:abc123" },
                ],
              },
            ],
            embed: null,
            likeCount: 5,
            replyCount: 1,
            repostCount: 2,
            permalink: "https://bsky.app/profile/test/post/def",
            createdAt: "2026-03-20T12:00:00.000Z",
          }),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      const mention = screen.getByText("@someone");
      expect(mention.tagName).toBe("A");
      expect(mention).toHaveAttribute("href", "https://bsky.app/profile/did:plc:abc123");
    });
  });

  it("renders external embed with thumbnail", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            text: "Check this out",
            facets: [],
            embed: {
              type: "external",
              external: {
                uri: "https://example.com/article",
                title: "Cool Article",
                description: "A description",
                thumb: "https://example.com/thumb.jpg",
              },
            },
            likeCount: 10,
            replyCount: 2,
            repostCount: 3,
            permalink: "https://bsky.app/profile/test/post/ext1",
            createdAt: "2026-03-20T12:00:00.000Z",
          }),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByText("Cool Article")).toBeInTheDocument();
    });
    expect(screen.getByText("A description")).toBeInTheDocument();
    const img = screen.getByAltText("Cool Article");
    expect(img).toBeInTheDocument();
  });

  it("renders external embed without thumbnail", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            text: "Check this",
            facets: [],
            embed: {
              type: "external",
              external: {
                uri: "https://example.com/article",
                title: "No Thumb Article",
                description: "A description",
              },
            },
            likeCount: 10,
            replyCount: 2,
            repostCount: 3,
            permalink: "https://bsky.app/profile/test/post/ext2",
            createdAt: "2026-03-20T12:00:00.000Z",
          }),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByText("No Thumb Article")).toBeInTheDocument();
    });
    const embedLink = screen.getByText("No Thumb Article").closest("a");
    expect(embedLink!.querySelectorAll("img")).toHaveLength(0);
  });

  it("renders single image embed without grid class", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            text: "A photo",
            facets: [],
            embed: {
              type: "images",
              images: [
                { thumb: "https://example.com/img1.jpg", fullsize: "https://example.com/img1-full.jpg", alt: "Image 1" },
              ],
            },
            likeCount: 8,
            replyCount: 0,
            repostCount: 1,
            permalink: "https://bsky.app/profile/test/post/img1",
            createdAt: "2026-03-20T12:00:00.000Z",
          }),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByAltText("Image 1")).toBeInTheDocument();
    });
    const container = screen.getByAltText("Image 1").closest("a")!.parentElement!;
    expect(container.className).not.toContain("grid");
  });

  it("renders multiple image embed with grid class", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            text: "Photos",
            facets: [],
            embed: {
              type: "images",
              images: [
                { thumb: "https://example.com/img1.jpg", fullsize: "https://example.com/img1-full.jpg", alt: "Image 1" },
                { thumb: "https://example.com/img2.jpg", fullsize: "https://example.com/img2-full.jpg", alt: "Image 2" },
              ],
            },
            likeCount: 12,
            replyCount: 1,
            repostCount: 4,
            permalink: "https://bsky.app/profile/test/post/img2",
            createdAt: "2026-03-20T12:00:00.000Z",
          }),
      })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByAltText("Image 1")).toBeInTheDocument();
    });
    const container = screen.getByAltText("Image 1").closest("a")!.parentElement!;
    expect(container.className).toContain("grid-cols-2");
  });

  it("shows error when response is not ok", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false })
    ) as jest.Mock;

    render(<BlogEntry />);

    await waitFor(() => {
      expect(screen.getByText("Could not load latest post.")).toBeInTheDocument();
    });
  });
});

describe("BioSections", () => {
  it("renders About me heading", () => {
    render(<BioSections />);
    expect(screen.getByText("About me:")).toBeInTheDocument();
  });

  it("renders Who I'd like to meet heading", () => {
    render(<BioSections />);
    expect(screen.getByText("Who I'd like to meet:")).toBeInTheDocument();
  });

  it("renders the bio text", () => {
    render(<BioSections />);
    expect(screen.getByText(/I'm Luka\. I'm a little scatterbrained/)).toBeInTheDocument();
  });
});

describe("InterestsTable", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as jest.Mock;
  });

  it("renders interest labels", () => {
    render(<InterestsTable />);
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("Movies")).toBeInTheDocument();
    expect(screen.getByText("Television")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
    expect(screen.getByText("Heroes")).toBeInTheDocument();
  });

  it("renders the section header", () => {
    render(<InterestsTable />);
    expect(screen.getByText("Interests")).toBeInTheDocument();
  });

  it("renders Spotify genre badges for Music row", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/spotify/wrapped")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tracks: [],
              artists: [],
              topGenres: ["indie pop", "alt rock", "electronic"],
              year: 2026,
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    }) as jest.Mock;

    render(<InterestsTable />);

    await waitFor(() => {
      expect(screen.getByText("indie pop")).toBeInTheDocument();
      expect(screen.getByText("alt rock")).toBeInTheDocument();
      expect(screen.getByText("electronic")).toBeInTheDocument();
    });
  });

  it("shows error message when Spotify fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("fail"))
    ) as jest.Mock;

    render(<InterestsTable />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load Spotify data")).toBeInTheDocument();
    });
  });

  it("renders Heroes badges as static values", () => {
    render(<InterestsTable />);
    const badge = screen.getByText("My Wife");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#F97316" });
    expect(screen.getByText("Eiichiro Oda")).toBeInTheDocument();
    expect(screen.getByText("Paul Rudd")).toBeInTheDocument();
  });

  it("renders General interests as orange badges", () => {
    render(<InterestsTable />);
    const badge = screen.getByText("Cooking");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#E67E22" });
    expect(screen.getByText("Video Games")).toBeInTheDocument();
    expect(screen.getByText("Coding")).toBeInTheDocument();
  });

  it("renders Movies as red badges", () => {
    render(<InterestsTable />);
    const badge = screen.getByText("Mean Girls");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#E74C3C" });
    expect(screen.getByText("Spirited Away")).toBeInTheDocument();
    expect(screen.getByText("Troll 2")).toBeInTheDocument();
  });

  it("renders Television as purple badges", () => {
    render(<InterestsTable />);
    const badge = screen.getByText("One Piece");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#9B59B6" });
    expect(screen.getByText("HIMYM")).toBeInTheDocument();
    expect(screen.getByText("Frieren")).toBeInTheDocument();
  });

  it("renders Books as blue badges", () => {
    render(<InterestsTable />);
    const badge = screen.getByText("House of Leaves");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "#3498DB" });
    expect(screen.getByText("The Salmon of Doubt")).toBeInTheDocument();
  });
});

describe("TopEight (Game Grid)", () => {
  const mockGames = {
    games: [
      { appid: 730, name: "Counter-Strike 2", playtimeMinutes: 14040, headerImage: "https://example.com/730.jpg", recentlyPlayed: true },
      { appid: 570, name: "Dota 2", playtimeMinutes: 8520, headerImage: "https://example.com/570.jpg", recentlyPlayed: false },
      { appid: 440, name: "Team Fortress 2", playtimeMinutes: 6000, headerImage: "https://example.com/440.jpg", recentlyPlayed: true },
    ],
  };

  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/steam")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGames),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      });
    }) as jest.Mock;
  });

  it("renders heading", () => {
    render(<TopEight />);
    expect(screen.getByText(/Top 8 Games/)).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;
    render(<TopEight />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders game names after successful fetch", async () => {
    render(<TopEight />);
    await waitFor(() => {
      expect(screen.getByText("Counter-Strike 2")).toBeInTheDocument();
    });
    expect(screen.getByText("Dota 2")).toBeInTheDocument();
    expect(screen.getByText("Team Fortress 2")).toBeInTheDocument();
  });

  it("calls onViewGame when a game is clicked", async () => {
    const onViewGame = jest.fn();
    render(<TopEight onViewGame={onViewGame} />);
    await waitFor(() => {
      expect(screen.getByText("Dota 2")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Dota 2").closest("button")!);
    expect(onViewGame).toHaveBeenCalledWith(mockGames.games[1]);
  });

  it("shows error message when Steam fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("Network error"))
    ) as jest.Mock;
    render(<TopEight />);
    await waitFor(() => {
      expect(screen.getByText("Unable to load Steam data")).toBeInTheDocument();
    });
  });
});

describe("GameStats", () => {
  const mockGame = {
    appid: 730,
    name: "Counter-Strike 2",
    playtimeMinutes: 14040,
    headerImage: "https://example.com/730.jpg",
    recentlyPlayed: true,
  };

  const mockAchievements = {
    achieved: 2,
    total: 5,
    achievements: [
      { apiname: "ach1", displayName: "First Blood", description: "Get your first kill", icon: "https://steam.com/ach1.jpg", unlocktime: 1700000000 },
      { apiname: "ach3", displayName: "Hat Trick", description: "Get three kills", icon: "https://steam.com/ach3.jpg", unlocktime: 1690000000 },
    ],
  };

  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/steam/achievements")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAchievements),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      });
    }) as jest.Mock;
  });

  it("renders game name and back button", () => {
    const onBack = jest.fn();
    render(<GameStats game={mockGame} onBack={onBack} />);
    expect(screen.getByText("Counter-Strike 2")).toBeInTheDocument();
    expect(screen.getByText("Back to Profile")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = jest.fn();
    render(<GameStats game={mockGame} onBack={onBack} />);
    fireEvent.click(screen.getByText("Back to Profile"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows playtime stats", async () => {
    render(<GameStats game={mockGame} onBack={jest.fn()} />);
    expect(screen.getByText("Total Playtime")).toBeInTheDocument();
    expect(screen.getByText("234.0 hrs")).toBeInTheDocument();
  });

  it("fetches and shows achievement progress bar", async () => {
    render(<GameStats game={mockGame} onBack={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("2 / 5")).toBeInTheDocument();
    });
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("displays earned achievement names and descriptions", async () => {
    render(<GameStats game={mockGame} onBack={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("First Blood")).toBeInTheDocument();
    });
    expect(screen.getByText("Get your first kill")).toBeInTheDocument();
    expect(screen.getByText("Hat Trick")).toBeInTheDocument();
    expect(screen.getByText("Get three kills")).toBeInTheDocument();
  });

  it("displays achievement icons", async () => {
    render(<GameStats game={mockGame} onBack={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("First Blood")).toBeInTheDocument();
    });
    const icons = screen.getAllByRole("img");
    const achIcons = icons.filter((img) => img.getAttribute("alt") === "First Blood" || img.getAttribute("alt") === "Hat Trick");
    expect(achIcons).toHaveLength(2);
  });

  it("shows recently played indicator", () => {
    render(<GameStats game={mockGame} onBack={jest.fn()} />);
    expect(screen.getByText("Played recently")).toBeInTheDocument();
  });

  it("shows not played recently for inactive game", () => {
    const inactiveGame = { ...mockGame, recentlyPlayed: false };
    render(<GameStats game={inactiveGame} onBack={jest.fn()} />);
    expect(screen.getByText("Not played recently")).toBeInTheDocument();
  });

  it("shows no achievements message when API returns null", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as jest.Mock;
    render(<GameStats game={mockGame} onBack={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("No achievements")).toBeInTheDocument();
    });
  });
});

/* ──────────────────────────────────────────────────────────────
   Edge-case tests that mock @/lib/data/personal for coverage.
   These use a separate test file pattern with jest.mock at the
   top level — see about-edges.test.tsx
   ────────────────────────────────────────────────────────────── */

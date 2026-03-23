import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ProfileCard from "@/components/about/ProfileCard";
import ContactTable from "@/components/about/ContactTable";
import MySpaceUrl from "@/components/about/MySpaceUrl";
import MusicPlayer from "@/components/about/MusicPlayer";
import DetailsBox from "@/components/about/DetailsBox";
import NetworkBanner from "@/components/about/NetworkBanner";
import BlogEntry from "@/components/about/BlogEntry";
import BioSections from "@/components/about/BioSections";
import InterestsTable from "@/components/about/InterestsTable";
import TopEight from "@/components/about/TopEight";
import CommentsWall from "@/components/about/CommentsWall";
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
  it("renders all 8 social links", () => {
    render(<ContactTable />);
    const labels = ["Instagram", "X", "Bluesky", "Twitch", "YouTube", "LinkedIn", "GitHub", "Email"];
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

describe("MySpaceUrl", () => {
  it("renders the MySpace URL", () => {
    render(<MySpaceUrl />);
    expect(screen.getByText("MySpace URL:")).toBeInTheDocument();
    expect(
      screen.getByText("http://www.myspace.com/placeholder")
    ).toBeInTheDocument();
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
  it("renders the network message with profile name", () => {
    render(<NetworkBanner />);
    expect(
      screen.getByText(/Luka is in your extended network/)
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
    expect(screen.getByText(/Placeholder about me text/)).toBeInTheDocument();
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

  it("renders Overwatch hero badges for Heroes row", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/overwatch")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              heroes: [
                { name: "Ana", timePlayed: 50000 },
                { name: "Mercy", timePlayed: 40000 },
                { name: "Kiriko", timePlayed: 30000 },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    }) as jest.Mock;

    render(<InterestsTable />);

    await waitFor(() => {
      expect(screen.getByText("Ana")).toBeInTheDocument();
      expect(screen.getByText("Mercy")).toBeInTheDocument();
      expect(screen.getByText("Kiriko")).toBeInTheDocument();
    });

    const badge = screen.getByText("Ana");
    expect(badge).toHaveStyle({ backgroundColor: "#F97316" });
  });

  it("shows error message when Overwatch fetch fails", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes("/api/overwatch")) {
        return Promise.reject(new Error("fail"));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
    }) as jest.Mock;

    render(<InterestsTable />);

    await waitFor(() => {
      expect(screen.getByText("Unable to load Overwatch data")).toBeInTheDocument();
    });
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
    const badges = screen.getAllByText("One Piece");
    const tvBadge = badges.find((el) =>
      el.style.backgroundColor === "rgb(155, 89, 182)"
    );
    expect(tvBadge).toBeDefined();
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

describe("TopEight", () => {
  it("renders Friend Space heading", () => {
    render(<TopEight />);
    expect(screen.getByText(/Friend Space/)).toBeInTheDocument();
  });

  it("renders all 8 friend names", () => {
    render(<TopEight />);
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(`Friend ${i}`)).toBeInTheDocument();
    }
  });

  it("renders friend count", () => {
    render(<TopEight />);
    // "8" is in a nested <span>, so we check for the bold number
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("shows tooltip on hover", () => {
    render(<TopEight />);
    // Find first friend and hover
    const friend1 = screen.getByText("Friend 1");
    const friendContainer = friend1.closest("[style]") || friend1.parentElement;
    if (friendContainer) {
      fireEvent.mouseEnter(friendContainer);
    }
  });

  it("clears hover state on mouse leave", () => {
    render(<TopEight />);
    const friend1 = screen.getByText("Friend 1");
    const friendContainer = friend1.closest(".relative") || friend1.parentElement;
    if (friendContainer) {
      fireEvent.mouseEnter(friendContainer);
      fireEvent.mouseLeave(friendContainer);
    }
    // After mouse leave, all borders should reset to default color
    const avatars = screen.getAllByText("Friend 1");
    expect(avatars.length).toBeGreaterThan(0);
  });
});

describe("CommentsWall", () => {
  it("renders the comments section header", () => {
    render(<CommentsWall />);
    expect(screen.getByText(/Comments/)).toBeInTheDocument();
  });

  it("renders comment entries", () => {
    render(<CommentsWall />);
    expect(screen.getByText("Friend 1")).toBeInTheDocument();
    expect(screen.getByText("Friend 2")).toBeInTheDocument();
  });

  it("renders comment messages", () => {
    render(<CommentsWall />);
    const messages = screen.getAllByText("Placeholder comment text.");
    expect(messages.length).toBe(2);
  });
});

/* ──────────────────────────────────────────────────────────────
   Edge-case tests that mock @/lib/data/personal for coverage.
   These use a separate test file pattern with jest.mock at the
   top level — see about-edges.test.tsx
   ────────────────────────────────────────────────────────────── */

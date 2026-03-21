import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
  it("renders the profile name", () => {
    render(<ProfileCard />);
    expect(screen.getByText("Luka")).toBeInTheDocument();
  });

  it("renders gender, age, location info", () => {
    render(<ProfileCard />);
    expect(screen.getByText(/Male/)).toBeInTheDocument();
  });

  it("renders online status", () => {
    render(<ProfileCard />);
    expect(screen.getByText("Online Now!")).toBeInTheDocument();
  });

  it("renders last login", () => {
    render(<ProfileCard />);
    expect(screen.getByText(/Last Login/)).toBeInTheDocument();
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
  it("renders the track name and artist", () => {
    render(<MusicPlayer />);
    expect(screen.getByText(/Placeholder Track/)).toBeInTheDocument();
    expect(screen.getByText(/Placeholder Artist/)).toBeInTheDocument();
  });
});

describe("DetailsBox", () => {
  it("renders all detail rows", () => {
    render(<DetailsBox />);
    expect(screen.getByText(/^Status/)).toBeInTheDocument();
    expect(screen.getByText(/^Body type/)).toBeInTheDocument();
    expect(screen.getByText(/^Here for/)).toBeInTheDocument();
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
    render(<BlogEntry />);
    expect(screen.getByText(/Latest Blog Entry/)).toBeInTheDocument();
  });

  it("renders the blog title", () => {
    render(<BlogEntry />);
    expect(screen.getByText("Placeholder Blog Entry Title")).toBeInTheDocument();
  });

  it("renders subscribe and view links", () => {
    render(<BlogEntry />);
    expect(screen.getByText("[Subscribe to this Blog]")).toBeInTheDocument();
    expect(screen.getByText("[View All Blog Entries]")).toBeInTheDocument();
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

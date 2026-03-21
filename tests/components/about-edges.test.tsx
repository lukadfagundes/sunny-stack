import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";

jest.mock("../../src/lib/data/personal", () => ({
  profile: { name: "Luka", tagline: "", gender: "Male", age: 0, location: "", country: "", status: "Online Now!", lastLogin: "" },
  aboutMe: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
  whoIdLikeToMeet: "Meet one.\n\nMeet two.",
  comments: [],
  topEight: [
    { name: "Real Friend", reason: "Best coding buddy" },
    { name: "Other Friend", reason: "Placeholder" },
  ],
  myspaceUrl: "",
  details: [],
  latestBlog: { title: "", preview: "" },
  interests: [],
  musicPlayer: { trackName: "", artist: "" },
  contactLinks: [],
}));

import CommentsWall from "@/components/about/CommentsWall";
import BioSections from "@/components/about/BioSections";
import TopEight from "@/components/about/TopEight";

describe("CommentsWall (empty comments)", () => {
  it("shows empty state when comments array is empty", () => {
    render(<CommentsWall />);
    expect(screen.getByText("No comments yet")).toBeInTheDocument();
  });
});

describe("BioSections (multi-paragraph)", () => {
  it("renders multiple paragraphs with margin between them", () => {
    render(<BioSections />);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Third paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Meet one.")).toBeInTheDocument();
    expect(screen.getByText("Meet two.")).toBeInTheDocument();
  });

  it("applies marginBottom to non-last paragraphs", () => {
    render(<BioSections />);
    const firstP = screen.getByText("First paragraph.");
    expect(firstP).toHaveStyle({ marginBottom: "0.75rem" });
    const secondP = screen.getByText("Second paragraph.");
    expect(secondP).toHaveStyle({ marginBottom: "0.75rem" });
    // Last paragraph should have no marginBottom
    const thirdP = screen.getByText("Third paragraph.");
    expect(thirdP).toHaveStyle({ marginBottom: "0" });
  });
});

describe("TopEight (tooltip visible)", () => {
  it("shows tooltip when reason is not Placeholder", () => {
    render(<TopEight />);
    const realFriend = screen.getByText("Real Friend");
    const friendContainer = realFriend.closest(".relative") || realFriend.parentElement;
    if (friendContainer) {
      fireEvent.mouseEnter(friendContainer);
    }
    expect(screen.getByText("Best coding buddy")).toBeInTheDocument();
  });

  it("does not show tooltip when reason is Placeholder", () => {
    render(<TopEight />);
    const otherFriend = screen.getByText("Other Friend");
    const friendContainer = otherFriend.closest(".relative") || otherFriend.parentElement;
    if (friendContainer) {
      fireEvent.mouseEnter(friendContainer);
    }
    // "Placeholder" should not appear as tooltip text
    // (the reason text should not render for Placeholder reasons)
    expect(screen.queryByText("Placeholder")).not.toBeInTheDocument();
  });
});

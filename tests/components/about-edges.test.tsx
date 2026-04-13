import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";

jest.mock("../../src/lib/data/personal", () => ({
  profile: {
    name: "Luka",
    tagline: "",
    gender: "Male",
    age: 0,
    location: "",
    country: "",
    status: "Online Now!",
    lastLogin: "",
  },
  aboutMe: "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.",
  whoIdLikeToMeet: "Meet one.\n\nMeet two.",
  details: [],
  latestBlog: { title: "", preview: "" },
  interests: [],
  musicPlayer: { trackName: "", artist: "" },
  contactLinks: [],
}));

import BioSections from "@/components/about/BioSections";

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

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import VideoCard from "@/components/about/VideoCard";

const mockVideo = {
  id: "vid1",
  title: "Test Video Title",
  description: "This is a test video description",
  thumbnailUrl: "https://i.ytimg.com/vi/vid1/hqdefault.jpg",
  publishedAt: "2026-03-20T12:00:00Z",
  viewCount: 1000,
  likeCount: 50,
  commentCount: 10,
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("VideoCard", () => {
  it("renders embedded YouTube iframe", () => {
    render(<VideoCard video={mockVideo} />);

    const iframe = document.querySelector("iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/vid1"
    );
    expect(iframe).toHaveAttribute("allowfullscreen");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups"
    );
  });

  it("displays video title", () => {
    render(<VideoCard video={mockVideo} />);

    expect(screen.getByText("Test Video Title")).toBeInTheDocument();
  });

  it("displays view count, like count, and comment count", () => {
    render(<VideoCard video={mockVideo} />);

    expect(screen.getByText("1.0K")).toBeInTheDocument(); // viewCount
    expect(screen.getByText("50")).toBeInTheDocument(); // likeCount
    expect(screen.getByText("10")).toBeInTheDocument(); // commentCount
  });

  it("shows Description button that expands full description on click", () => {
    render(<VideoCard video={mockVideo} />);

    // Description should not be visible initially
    expect(
      screen.queryByText("This is a test video description")
    ).not.toBeInTheDocument();

    // Click Description button
    fireEvent.click(screen.getByText("Description"));

    // Description should now be visible
    expect(
      screen.getByText("This is a test video description")
    ).toBeInTheDocument();
    expect(screen.getByText("Hide description")).toBeInTheDocument();
  });

  it("collapses description on second click", () => {
    render(<VideoCard video={mockVideo} />);

    fireEvent.click(screen.getByText("Description"));
    expect(
      screen.getByText("This is a test video description")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide description"));
    expect(
      screen.queryByText("This is a test video description")
    ).not.toBeInTheDocument();
  });

  it("displays formatted date", () => {
    render(<VideoCard video={mockVideo} />);

    expect(screen.getByText("March 20, 2026")).toBeInTheDocument();
  });

  it("hides description button when description is empty", () => {
    const noDescVideo = { ...mockVideo, description: "" };
    render(<VideoCard video={noDescVideo} />);

    expect(screen.getByText("Test Video Title")).toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("formats large view counts with M suffix", () => {
    const bigVideo = { ...mockVideo, viewCount: 2500000 };
    render(<VideoCard video={bigVideo} />);

    expect(screen.getByText("2.5M")).toBeInTheDocument();
  });
});

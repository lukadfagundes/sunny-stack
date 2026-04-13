import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import VideoGallery from "@/components/about/VideoGallery";

const mockVideos = [
  {
    id: "vid1",
    title: "First Video",
    description: "Description one",
    thumbnailUrl: "https://i.ytimg.com/vi/vid1/hqdefault.jpg",
    publishedAt: "2026-03-20T12:00:00Z",
    viewCount: 1000,
    likeCount: 50,
    commentCount: 10,
  },
  {
    id: "vid2",
    title: "Second Video",
    description: "Description two",
    thumbnailUrl: "https://i.ytimg.com/vi/vid2/hqdefault.jpg",
    publishedAt: "2026-03-19T12:00:00Z",
    viewCount: 500,
    likeCount: 25,
    commentCount: 5,
  },
];

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("VideoGallery", () => {
  it("shows loading skeletons initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<VideoGallery onBack={jest.fn()} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders videos after loading", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVideos),
      }),
    ) as jest.Mock;

    render(<VideoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("First Video")).toBeInTheDocument();
    });

    const iframes = document.querySelectorAll("iframe");
    expect(iframes).toHaveLength(2);
  });

  it("renders YouTube-branded header", () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVideos),
      }),
    ) as jest.Mock;

    render(<VideoGallery onBack={jest.fn()} />);

    expect(screen.getByText("Luka's Videos")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("fail")),
    ) as jest.Mock;

    render(<VideoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load videos. Please try again later."),
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no videos returned", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }),
    ) as jest.Mock;

    render(<VideoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("No videos to display.")).toBeInTheDocument();
    });
  });

  it("calls onBack when Back to Profile is clicked", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVideos),
      }),
    ) as jest.Mock;

    const onBack = jest.fn();
    render(<VideoGallery onBack={onBack} />);

    fireEvent.click(screen.getByText("Back to Profile"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows error on non-ok response", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false })) as jest.Mock;

    render(<VideoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load videos. Please try again later."),
      ).toBeInTheDocument();
    });
  });
});

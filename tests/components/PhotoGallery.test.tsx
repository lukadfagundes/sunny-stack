import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import PhotoGallery from "@/components/about/PhotoGallery";

const mockPosts = [
  {
    id: "1",
    imageUrl: "https://cdn.instagram.com/photo1.jpg",
    caption: "Beach day",
    timestamp: "2026-03-20T12:00:00+0000",
    permalink: "https://instagram.com/p/abc",
    likeCount: 42,
    commentsCount: 3,
  },
  {
    id: "2",
    imageUrl: "https://cdn.instagram.com/photo2.jpg",
    caption: "",
    timestamp: "2026-03-19T12:00:00+0000",
    permalink: "https://instagram.com/p/def",
    likeCount: 0,
    commentsCount: 0,
  },
];

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("PhotoGallery", () => {
  it("shows loading skeletons initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders photos with captions after loading", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPosts),
      })
    ) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Beach day")).toBeInTheDocument();
    });

    const images = document.querySelectorAll("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://cdn.instagram.com/photo1.jpg");
  });

  it("renders Instagram-branded header", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPosts),
      })
    ) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    expect(screen.getByText("Luka's Pics")).toBeInTheDocument();
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("fail"))) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load photos. Please try again later.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no photos returned", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("No photos to display.")).toBeInTheDocument();
    });
  });

  it("calls onBack when Back to Profile is clicked", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPosts),
      })
    ) as jest.Mock;

    const onBack = jest.fn();
    render(<PhotoGallery onBack={onBack} />);

    fireEvent.click(screen.getByText("Back to Profile"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("displays like and comment counts", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockPosts),
      })
    ) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Beach day")).toBeInTheDocument();
    });

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("shows error on non-ok response", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false })
    ) as jest.Mock;

    render(<PhotoGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load photos. Please try again later.")
      ).toBeInTheDocument();
    });
  });
});

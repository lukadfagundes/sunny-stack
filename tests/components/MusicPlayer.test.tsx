import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import MusicPlayer from "@/components/about/MusicPlayer";

const mockTrack = {
  id: "track123",
  name: "Test Song",
  artist: "Test Artist",
  albumName: "Test Album",
  albumImageUrl: "https://i.scdn.co/image/album.jpg",
  spotifyUrl: "https://open.spotify.com/track/track123",
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("MusicPlayer", () => {
  it("shows loading state initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<MusicPlayer />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Spotify embed iframe after loading", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrack),
      }),
    ) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      const iframe = document.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
    });

    const iframe = document.querySelector("iframe");
    expect(iframe?.src).toContain(
      "https://open.spotify.com/embed/track/track123",
    );
    expect(iframe?.src).toContain("theme=0");
    expect(iframe).toHaveAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups",
    );
  });

  it("renders 'Check out more music' button that calls onViewMusic", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrack),
      }),
    ) as jest.Mock;

    const onViewMusic = jest.fn();
    render(<MusicPlayer onViewMusic={onViewMusic} />);

    const button = screen.getByText("Check out more music");
    fireEvent.click(button);
    expect(onViewMusic).toHaveBeenCalledTimes(1);
  });

  it("shows fallback when API returns null", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      }),
    ) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      expect(screen.getByText("No track available")).toBeInTheDocument();
    });

    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("fail")),
    ) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      expect(screen.getByText("Could not load music.")).toBeInTheDocument();
    });
  });

  it("shows error on non-ok response", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false })) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      expect(screen.getByText("Could not load music.")).toBeInTheDocument();
    });
  });

  it("does not render 'Check out more music' when onViewMusic is not provided", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrack),
      }),
    ) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      expect(document.querySelector("iframe")).toBeInTheDocument();
    });

    expect(screen.queryByText("Check out more music")).not.toBeInTheDocument();
  });

  it("sets correct iframe title for accessibility", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTrack),
      }),
    ) as jest.Mock;

    render(<MusicPlayer />);

    await waitFor(() => {
      expect(document.querySelector("iframe")).toBeInTheDocument();
    });

    const iframe = document.querySelector("iframe");
    expect(iframe?.title).toBe("Play Test Song by Test Artist");
  });
});

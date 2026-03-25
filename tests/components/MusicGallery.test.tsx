import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import MusicGallery from "@/components/about/MusicGallery";

const mockWrappedData = {
  tracks: [
    {
      id: "t1",
      name: "Song One",
      artist: "Artist A",
      albumName: "Album A",
      albumImageUrl: "https://i.scdn.co/image/album-a.jpg",
      spotifyUrl: "https://open.spotify.com/track/t1",
    },
    {
      id: "t2",
      name: "Song Two",
      artist: "Artist B, Artist C",
      albumName: "Album B",
      albumImageUrl: "https://i.scdn.co/image/album-b.jpg",
      spotifyUrl: "https://open.spotify.com/track/t2",
    },
  ],
  artists: [
    {
      id: "a1",
      name: "Artist A",
      imageUrl: "https://i.scdn.co/image/artist-a.jpg",
      genres: ["pop", "indie pop"],
      spotifyUrl: "https://open.spotify.com/artist/a1",
    },
    {
      id: "a2",
      name: "Artist B",
      imageUrl: "",
      genres: [],
      spotifyUrl: "https://open.spotify.com/artist/a2",
    },
  ],
  topGenres: ["pop", "indie pop", "dance pop"],
  year: 2026,
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("MusicGallery", () => {
  it("shows loading skeletons initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("renders Spotify-branded header", () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWrappedData),
      })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    expect(screen.getByText("Luka's Music")).toBeInTheDocument();
  });

  it("renders tracks after loading", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWrappedData),
      })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Song One")).toBeInTheDocument();
    });

    expect(screen.getByText("Song Two")).toBeInTheDocument();
    // "Artist A" appears in both tracks and artists sections
    expect(screen.getAllByText("Artist A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Artist B, Artist C")).toBeInTheDocument();
    expect(screen.getByText("Top Tracks")).toBeInTheDocument();
  });

  it("renders artists after loading", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWrappedData),
      })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Top Artists")).toBeInTheDocument();
    });

    // Artist A with genres
    expect(screen.getByText("pop, indie pop")).toBeInTheDocument();
  });

  it("renders genre pills", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWrappedData),
      })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Top Genres")).toBeInTheDocument();
    });

    expect(screen.getByText("dance pop")).toBeInTheDocument();
  });

  it("renders Recent Favorites subheader", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWrappedData),
      })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Luka's Recent Favorites")).toBeInTheDocument();
    });
  });

  it("calls onBack when Back to Profile is clicked", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockWrappedData),
      })
    ) as jest.Mock;

    const onBack = jest.fn();
    render(<MusicGallery onBack={onBack} />);

    fireEvent.click(screen.getByText("Back to Profile"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("fail"))
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load music data. Please try again later.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when null returned", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("No music data to display.")
      ).toBeInTheDocument();
    });
  });

  it("shows error on non-ok response", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false })
    ) as jest.Mock;

    render(<MusicGallery onBack={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Could not load music data. Please try again later.")
      ).toBeInTheDocument();
    });
  });
});

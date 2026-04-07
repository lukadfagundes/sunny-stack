import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import AboutPage from "@/app/about/page";

beforeEach(() => {
  // PhotoGallery and BlogEntry fetch on mount — provide a default mock
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  ) as jest.Mock;
});

describe("AboutPage", () => {
  it("renders the profile card with name", () => {
    render(<AboutPage />);
    expect(screen.getByText("Luka")).toBeInTheDocument();
  });

  it("renders the contacting section", () => {
    render(<AboutPage />);
    expect(screen.getByText(/Contacting/)).toBeInTheDocument();
  });

  it("renders the network banner", () => {
    render(<AboutPage />);
    expect(
      screen.getByText(/Self-taught full stack developer/)
    ).toBeInTheDocument();
  });

  it("renders the blurbs section", () => {
    render(<AboutPage />);
    expect(screen.getByText("About me:")).toBeInTheDocument();
  });

  it("wraps content in a main element", () => {
    const { container } = render(<AboutPage />);
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  it("switches to photo gallery when Pics is clicked", async () => {
    render(<AboutPage />);

    // Profile view should be visible
    expect(screen.getByText("About me:")).toBeInTheDocument();

    // Click Pics
    fireEvent.click(screen.getByText("Pics"));

    // Gallery should appear, profile content should be gone
    await waitFor(() => {
      expect(screen.getByText("Luka's Pics")).toBeInTheDocument();
    });
    expect(screen.queryByText("About me:")).not.toBeInTheDocument();
  });

  it("switches back to profile when Back to Profile is clicked", async () => {
    render(<AboutPage />);

    // Switch to gallery
    fireEvent.click(screen.getByText("Pics"));

    await waitFor(() => {
      expect(screen.getByText("Luka's Pics")).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByText("Back to Profile"));

    // Profile content should be back
    expect(screen.getByText("About me:")).toBeInTheDocument();
    expect(screen.queryByText("Luka's Pics")).not.toBeInTheDocument();
  });

  it("switches to video gallery when Videos is clicked", async () => {
    render(<AboutPage />);

    // Profile view should be visible
    expect(screen.getByText("About me:")).toBeInTheDocument();

    // Click Videos
    fireEvent.click(screen.getByText("Videos"));

    // Video gallery should appear, profile content should be gone
    await waitFor(() => {
      expect(screen.getByText("Luka's Videos")).toBeInTheDocument();
    });
    expect(screen.queryByText("About me:")).not.toBeInTheDocument();
  });

  it("switches back to profile from video gallery", async () => {
    render(<AboutPage />);

    // Switch to video gallery
    fireEvent.click(screen.getByText("Videos"));

    await waitFor(() => {
      expect(screen.getByText("Luka's Videos")).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByText("Back to Profile"));

    // Profile content should be back
    expect(screen.getByText("About me:")).toBeInTheDocument();
    expect(screen.queryByText("Luka's Videos")).not.toBeInTheDocument();
  });

  it("switches to music gallery when Check out more music is clicked", async () => {
    render(<AboutPage />);

    // Profile view should be visible
    expect(screen.getByText("About me:")).toBeInTheDocument();

    // Click "Check out more music" in MusicPlayer
    fireEvent.click(screen.getByText("Check out more music"));

    // Music gallery should appear, profile content should be gone
    await waitFor(() => {
      expect(screen.getByText("Luka's Music")).toBeInTheDocument();
    });
    expect(screen.queryByText("About me:")).not.toBeInTheDocument();
  });

  it("switches back to profile from music gallery", async () => {
    render(<AboutPage />);

    // Switch to music gallery
    fireEvent.click(screen.getByText("Check out more music"));

    await waitFor(() => {
      expect(screen.getByText("Luka's Music")).toBeInTheDocument();
    });

    // Click back
    fireEvent.click(screen.getByText("Back to Profile"));

    // Profile content should be back
    expect(screen.getByText("About me:")).toBeInTheDocument();
    expect(screen.queryByText("Luka's Music")).not.toBeInTheDocument();
  });
});

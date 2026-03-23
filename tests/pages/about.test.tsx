import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "../../tests/helpers/mocks";
import AboutPage from "@/app/about/page";

beforeEach(() => {
  // PhotoGallery fetches on mount — provide a default mock
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
      screen.getByText(/is in your extended network/)
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
});

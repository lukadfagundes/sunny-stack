import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import AboutPage from "@/app/about/page";

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
});

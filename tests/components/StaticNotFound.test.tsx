import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import StaticNotFound from "@/components/404/StaticNotFound";

describe("StaticNotFound", () => {
  it("renders 404 heading", () => {
    render(<StaticNotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders the lost message", () => {
    render(<StaticNotFound />);
    expect(
      screen.getByText("You Got Lost Again, Didn't You?")
    ).toBeInTheDocument();
  });

  it("renders navigation tips", () => {
    render(<StaticNotFound />);
    expect(screen.getByText("Marimo Navigation Tips:")).toBeInTheDocument();
    expect(
      screen.getByText(/Turn around 180/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Follow literally anyone/)
    ).toBeInTheDocument();
  });

  it("renders the Go Home link", () => {
    render(<StaticNotFound />);
    const link = screen.getByRole("link", { name: /Go Home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the error footer", () => {
    render(<StaticNotFound />);
    expect(
      screen.getByText(/Error 404: Page not found/)
    ).toBeInTheDocument();
  });

  it("renders the Zoro quote", () => {
    render(<StaticNotFound />);
    expect(
      screen.getByText(/I'm not lost/)
    ).toBeInTheDocument();
  });
});

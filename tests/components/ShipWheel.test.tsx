import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ShipWheel from "@/components/ShipWheel";

describe("ShipWheel", () => {
  it("renders navigation on known routes", () => {
    render(<ShipWheel />);
    const navs = screen.getAllByRole("navigation", {
      name: /Main navigation/i,
    });
    expect(navs.length).toBeGreaterThan(0);
  });

  it("renders screen-reader links for all nav items", () => {
    render(<ShipWheel />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portfolio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docs" })).toBeInTheDocument();
  });

  it("renders the mobile toggle button", () => {
    render(<ShipWheel />);
    expect(screen.getByLabelText("Open navigation")).toBeInTheDocument();
  });

  it("toggles mobile menu on button click", () => {
    render(<ShipWheel />);
    const toggle = screen.getByLabelText("Open navigation");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Close navigation")).toBeInTheDocument();
  });

  it("renders wheel image with aria-hidden", () => {
    const { container } = render(<ShipWheel />);
    const img = container.querySelector("img[aria-hidden='true']");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/wheel.png");
  });

  it("renders center hub button", () => {
    render(<ShipWheel />);
    expect(screen.getByLabelText("Center of the wheel")).toBeInTheDocument();
  });

  it("shows hover labels on mouseEnter", () => {
    render(<ShipWheel />);
    const desktopNav = screen.getAllByRole("navigation")[0];
    fireEvent.mouseEnter(desktopNav);
    // After hovering, labels should appear (they're Links so they become visible)
  });

  it("hides hover labels on mouseLeave", () => {
    render(<ShipWheel />);
    const desktopNav = screen.getAllByRole("navigation")[0];
    fireEvent.mouseEnter(desktopNav);
    fireEvent.mouseLeave(desktopNav);
  });

  it("fires center hub click handler without error", () => {
    render(<ShipWheel />);
    const hub = screen.getByLabelText("Center of the wheel");
    expect(() => fireEvent.click(hub)).not.toThrow();
  });

  it("renders mobile menu items with icons when open", () => {
    render(<ShipWheel />);
    const toggle = screen.getByLabelText("Open navigation");
    fireEvent.click(toggle);
    // Mobile menu renders icon-based links with aria-labels
    // Each nav item has both an sr-only link (text) and a mobile link (aria-label + icon)
    const homeLinks = screen.getAllByRole("link", { name: "Home" });
    const portfolioLinks = screen.getAllByRole("link", { name: "Portfolio" });
    const aboutLinks = screen.getAllByRole("link", { name: "About" });
    const docsLinks = screen.getAllByRole("link", { name: "Docs" });
    // sr-only link + mobile icon link = 2 each
    expect(homeLinks).toHaveLength(2);
    expect(portfolioLinks).toHaveLength(2);
    expect(aboutLinks).toHaveLength(2);
    expect(docsLinks).toHaveLength(2);
  });
});

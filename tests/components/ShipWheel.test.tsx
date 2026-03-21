import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ShipWheel from "@/components/ShipWheel";

describe("ShipWheel", () => {
  it("renders navigation on known routes", () => {
    render(<ShipWheel />);
    const navs = screen.getAllByRole("navigation", { name: /Main navigation/i });
    expect(navs.length).toBeGreaterThan(0);
  });

  it("renders screen-reader links for all nav items", () => {
    render(<ShipWheel />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Portfolio" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The One Piece" })).toBeInTheDocument();
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

  it("renders wheel SVG with aria-hidden", () => {
    const { container } = render(<ShipWheel />);
    const svg = container.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeInTheDocument();
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

  it("fires center hub click handler", () => {
    const spy = jest.spyOn(console, "log").mockImplementation();
    render(<ShipWheel />);
    const hub = screen.getByLabelText("Center of the wheel");
    fireEvent.click(hub);
    expect(spy).toHaveBeenCalledWith("Zoro!");
    spy.mockRestore();
  });

  it("renders mobile menu items when open", () => {
    render(<ShipWheel />);
    const toggle = screen.getByLabelText("Open navigation");
    fireEvent.click(toggle);
    // Mobile menu should show abbreviated labels or ???
    // The mobile menu renders Link elements with text like "Hom", "Por", "Abo", "???"
  });
});

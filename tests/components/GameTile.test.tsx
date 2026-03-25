import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import GameTile from "@/components/404/GameTile";

describe("GameTile", () => {
  it("renders an empty tile with correct label", () => {
    render(<GameTile type="empty" isPlayer={false} isGoal={false} row={0} col={0} />);
    expect(screen.getByLabelText("Empty tile")).toBeInTheDocument();
  });

  it("renders player tile with correct label", () => {
    render(<GameTile type="empty" isPlayer={true} isGoal={false} row={0} col={0} />);
    expect(screen.getByLabelText("Zoro (you)")).toBeInTheDocument();
  });

  it("renders goal tile with correct label", () => {
    render(<GameTile type="empty" isPlayer={false} isGoal={true} row={0} col={0} />);
    expect(screen.getByLabelText("Thousand Sunny (goal)")).toBeInTheDocument();
  });

  it("renders sake tile with correct label", () => {
    render(<GameTile type="sake" isPlayer={false} isGoal={false} row={0} col={0} />);
    expect(screen.getByLabelText("Sake shop")).toBeInTheDocument();
  });

  it("renders deadend tile with correct label", () => {
    render(<GameTile type="deadend" isPlayer={false} isGoal={false} row={0} col={0} />);
    expect(screen.getByLabelText("Dead end")).toBeInTheDocument();
  });

  it("does not show obstacle icon when player is on a sake tile", () => {
    const { container } = render(
      <GameTile type="sake" isPlayer={true} isGoal={false} row={0} col={0} />
    );
    // Player tile label should show, not sake shop
    expect(screen.getByLabelText("Zoro (you)")).toBeInTheDocument();
    // The gridcell should not show sake styling for obstacles
    expect(container.querySelector("[role=gridcell]")).toBeInTheDocument();
  });

  it("renders goal highlight background", () => {
    const { container } = render(
      <GameTile type="empty" isPlayer={false} isGoal={true} row={0} col={0} />
    );
    const cell = container.querySelector("[role=gridcell]") as HTMLElement;
    expect(cell.style.background).toContain("rgba(240, 180, 41");
  });
});

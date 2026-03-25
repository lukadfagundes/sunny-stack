import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import DPad from "@/components/404/DPad";

describe("DPad", () => {
  it("renders 4 directional buttons", () => {
    render(<DPad onMove={jest.fn()} />);
    expect(screen.getByLabelText("Move up")).toBeInTheDocument();
    expect(screen.getByLabelText("Move down")).toBeInTheDocument();
    expect(screen.getByLabelText("Move left")).toBeInTheDocument();
    expect(screen.getByLabelText("Move right")).toBeInTheDocument();
  });

  it("calls onMove with correct direction on click", () => {
    const onMove = jest.fn();
    render(<DPad onMove={onMove} />);

    fireEvent.click(screen.getByLabelText("Move up"));
    expect(onMove).toHaveBeenCalledWith("up");

    fireEvent.click(screen.getByLabelText("Move down"));
    expect(onMove).toHaveBeenCalledWith("down");

    fireEvent.click(screen.getByLabelText("Move left"));
    expect(onMove).toHaveBeenCalledWith("left");

    fireEvent.click(screen.getByLabelText("Move right"));
    expect(onMove).toHaveBeenCalledWith("right");
  });

  it("disables buttons when disabled prop is true", () => {
    render(<DPad onMove={jest.fn()} disabled />);
    expect(screen.getByLabelText("Move up")).toBeDisabled();
    expect(screen.getByLabelText("Move down")).toBeDisabled();
    expect(screen.getByLabelText("Move left")).toBeDisabled();
    expect(screen.getByLabelText("Move right")).toBeDisabled();
  });

  it("does not call onMove when disabled", () => {
    const onMove = jest.fn();
    render(<DPad onMove={onMove} disabled />);
    fireEvent.click(screen.getByLabelText("Move up"));
    expect(onMove).not.toHaveBeenCalled();
  });
});

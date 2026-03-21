import { renderHook, act } from "@testing-library/react";
import { useGameInput } from "@/components/404/useGameInput";

describe("useGameInput", () => {
  // ── Keyboard input ──

  it("calls onMove with correct direction for arrow keys", () => {
    const onMove = jest.fn();
    renderHook(() => useGameInput(onMove));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    });
    expect(onMove).toHaveBeenCalledWith("up");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    });
    expect(onMove).toHaveBeenCalledWith("down");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    });
    expect(onMove).toHaveBeenCalledWith("left");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });
    expect(onMove).toHaveBeenCalledWith("right");

    expect(onMove).toHaveBeenCalledTimes(4);
  });

  it("supports WASD keys (both cases)", () => {
    const onMove = jest.fn();
    renderHook(() => useGameInput(onMove));

    const keys: Array<[string, string]> = [
      ["w", "up"], ["W", "up"],
      ["a", "left"], ["A", "left"],
      ["s", "down"], ["S", "down"],
      ["d", "right"], ["D", "right"],
    ];

    for (const [key, dir] of keys) {
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      });
      expect(onMove).toHaveBeenLastCalledWith(dir);
    }

    expect(onMove).toHaveBeenCalledTimes(8);
  });

  it("ignores non-movement keys", () => {
    const onMove = jest.fn();
    renderHook(() => useGameInput(onMove));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));
    });

    expect(onMove).not.toHaveBeenCalled();
  });

  it("does not call onMove when disabled", () => {
    const onMove = jest.fn();
    renderHook(() => useGameInput(onMove, true));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    });

    expect(onMove).not.toHaveBeenCalled();
  });

  it("cleans up keyboard listener on unmount", () => {
    const onMove = jest.fn();
    const { unmount } = renderHook(() => useGameInput(onMove));

    unmount();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    });

    expect(onMove).not.toHaveBeenCalled();
  });

  // ── Touch swipe input ──

  it("returns touch handlers", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove));

    expect(result.current.onTouchStart).toBeInstanceOf(Function);
    expect(result.current.onTouchEnd).toBeInstanceOf(Function);
  });

  it("does not fire for swipes below threshold (50px)", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 130, clientY: 110 }],
      } as unknown as React.TouchEvent);
    });

    expect(onMove).not.toHaveBeenCalled();
  });

  it("detects horizontal swipe right", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 200, clientY: 110 }],
      } as unknown as React.TouchEvent);
    });

    expect(onMove).toHaveBeenCalledWith("right");
  });

  it("detects horizontal swipe left", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 200, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 100, clientY: 110 }],
      } as unknown as React.TouchEvent);
    });

    expect(onMove).toHaveBeenCalledWith("left");
  });

  it("detects vertical swipe down", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 110, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    expect(onMove).toHaveBeenCalledWith("down");
  });

  it("detects vertical swipe up", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 200 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 110, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    expect(onMove).toHaveBeenCalledWith("up");
  });

  it("does not fire touch swipe when disabled", () => {
    const onMove = jest.fn();
    const { result } = renderHook(() => useGameInput(onMove, true));

    act(() => {
      result.current.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    act(() => {
      result.current.onTouchEnd({
        changedTouches: [{ clientX: 200, clientY: 100 }],
      } as unknown as React.TouchEvent);
    });

    expect(onMove).not.toHaveBeenCalled();
  });
});

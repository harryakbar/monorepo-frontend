import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnimatedStatistic, useCountUp } from "./index";

// Mock requestAnimationFrame
describe("useCountUp", () => {
  let rafTime: number;

  beforeEach(() => {
    vi.useFakeTimers();
    rafTime = 0;
    // Mock requestAnimationFrame to pass timestamp to callback
    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(() => {
        rafTime += 16; // Simulate ~60fps
        cb(rafTime);
      }, 16) as unknown as number;
    });
    global.cancelAnimationFrame = vi.fn((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should start at 0", () => {
    const { result } = renderHook(() => useCountUp(100, 1000));
    expect(result.current).toBe(0);
  });

  it("should return 0 when end is null", () => {
    const { result } = renderHook(() => useCountUp(null, 1000));
    expect(result.current).toBe(0);
  });

  it("should return 0 when end is undefined", () => {
    const { result } = renderHook(() => useCountUp(undefined as any, 1000));
    expect(result.current).toBe(0);
  });

  it("should animate to the target value", async () => {
    const { result } = renderHook(() => useCountUp(100, 1000));

    // Initially at 0
    expect(result.current).toBe(0);

    // Fast-forward time to complete animation
    // Need to advance timers multiple times to simulate requestAnimationFrame calls
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(10);
      }
    });

    // Should be at or near the target value
    expect(result.current).toBeGreaterThanOrEqual(90);
    expect(result.current).toBeLessThanOrEqual(100);
  });

  it("should reset to 0 when end value changes", async () => {
    const { result, rerender } = renderHook(
      ({ end }) => useCountUp(end, 1000),
      {
        initialProps: { end: 100 },
      }
    );

    // Fast-forward to animate first value
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(10);
      }
    });

    expect(result.current).toBeGreaterThanOrEqual(90);

    // Change the end value
    rerender({ end: 200 });

    // Should reset to 0
    expect(result.current).toBe(0);

    // Fast-forward to animate new value
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(10);
      }
    });

    expect(result.current).toBeGreaterThanOrEqual(180);
  });

  it("should handle large numbers", async () => {
    const { result } = renderHook(() => useCountUp(637611790, 1000));

    await act(async () => {
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(10);
      }
    });

    expect(result.current).toBeGreaterThanOrEqual(500000000);
    expect(result.current).toBeLessThanOrEqual(637611790);
  });

  it("should clean up animation on unmount", () => {
    const { unmount } = renderHook(() => useCountUp(100, 1000));

    expect(global.requestAnimationFrame).toHaveBeenCalled();

    unmount();

    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });
});

describe("AnimatedStatistic", () => {
  let rafTime: number;

  beforeEach(() => {
    vi.useFakeTimers();
    rafTime = 0;
    // Mock requestAnimationFrame to pass timestamp to callback
    global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      return setTimeout(() => {
        rafTime += 16; // Simulate ~60fps
        cb(rafTime);
      }, 16) as unknown as number;
    });
    global.cancelAnimationFrame = vi.fn((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should render loading state", () => {
    render(<AnimatedStatistic value={null} isLoading={true} error={null} />);
    expect(screen.getByText("...")).toBeInTheDocument();
  });

  it("should render error state", () => {
    render(
      <AnimatedStatistic
        value={null}
        isLoading={false}
        error={new Error("Error")}
      />
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should render error state when value is null", () => {
    render(<AnimatedStatistic value={null} isLoading={false} error={null} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should render animated value", async () => {
    render(<AnimatedStatistic value={1000} isLoading={false} error={null} />);

    // Initially should show 0
    expect(screen.getByText("0")).toBeInTheDocument();

    // Fast-forward animation - advance timers to complete the 2000ms animation duration
    // We need to advance in smaller increments to ensure requestAnimationFrame callbacks execute
    await act(async () => {
      // Advance timers in increments to simulate animation frames
      for (let i = 0; i < 200; i++) {
        vi.advanceTimersByTime(10);
      }
      // Ensure we've passed the full duration
      vi.advanceTimersByTime(100);
    });

    // Should show formatted number (should be at or near final value after animation completes)
    const element = screen.getByText(/\d+/);
    expect(element).toBeInTheDocument();
    const text = element.textContent || "";
    const num = parseInt(text.replace(/,/g, ""), 10);
    expect(num).toBeGreaterThan(0);
    expect(num).toBeLessThanOrEqual(1000);
  });

  it("should format large numbers with commas", async () => {
    render(
      <AnimatedStatistic value={637611790} isLoading={false} error={null} />
    );

    await act(async () => {
      // Advance timers in increments to simulate animation frames
      for (let i = 0; i < 200; i++) {
        vi.advanceTimersByTime(10);
      }
      // Ensure we've passed the full duration
      vi.advanceTimersByTime(100);
    });

    // Should show formatted number with commas
    const element = screen.getByText(/\d+/);
    expect(element).toBeInTheDocument();
    const text = element.textContent || "";
    // Check that it contains commas (formatted number)
    expect(text).toContain(",");
    const num = parseInt(text.replace(/,/g, ""), 10);
    expect(num).toBeGreaterThan(0);
    expect(num).toBeLessThanOrEqual(637611790);
  });

  it("should prioritize loading over error", () => {
    render(
      <AnimatedStatistic
        value={100}
        isLoading={true}
        error={new Error("Error")}
      />
    );
    expect(screen.getByText("...")).toBeInTheDocument();
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });
});

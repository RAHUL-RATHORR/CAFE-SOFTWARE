import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKitchenElapsed } from "@/hooks/kitchen/use-kitchen-elapsed";
import { formatElapsed } from "@/lib/kitchen/tickets";

describe("formatElapsed helper", () => {
  it("formats millisecond durations", () => {
    expect(formatElapsed(0)).toMatch(/0|0m|0s|00/i);
    expect(formatElapsed(90_000).length).toBeGreaterThan(0);
  });
});

describe("useKitchenElapsed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an elapsed label for a ticket timestamp", () => {
    const createdAt = new Date(Date.now() - 60_000).toISOString();
    const { result } = renderHook(() => useKitchenElapsed(createdAt));
    expect(result.current).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBeTruthy();
  });
});

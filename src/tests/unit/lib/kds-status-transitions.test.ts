import { describe, expect, it } from "vitest";
import {
  calculateUrgency,
  formatElapsed,
  isValidStatusTransition,
  nextKitchenStatus,
} from "@/lib/kitchen/tickets";
import { buildKitchenChannel } from "@/lib/kitchen/realtime";
import { KITCHEN_BOARD_COLUMNS, KITCHEN_STATUS_TO_COLUMN } from "@/config/kitchen";

describe("KDS Status Transitions & Workflow Rules", () => {
  it("allows correct linear kitchen status transitions", () => {
    // pending -> confirmed (ACCEPT)
    expect(isValidStatusTransition("pending", "confirmed")).toBe(true);
    // confirmed -> preparing (START PREPARING)
    expect(isValidStatusTransition("confirmed", "preparing")).toBe(true);
    // preparing -> ready (READY)
    expect(isValidStatusTransition("preparing", "ready")).toBe(true);
    // ready -> served (SERVED)
    expect(isValidStatusTransition("ready", "served")).toBe(true);
  });

  it("allows cancellation from any active status", () => {
    expect(isValidStatusTransition("pending", "cancelled")).toBe(true);
    expect(isValidStatusTransition("confirmed", "cancelled")).toBe(true);
    expect(isValidStatusTransition("preparing", "cancelled")).toBe(true);
    expect(isValidStatusTransition("ready", "cancelled")).toBe(true);
  });

  it("strictly rejects invalid backwards or arbitrary transitions", () => {
    // READY -> PREPARING must fail
    expect(isValidStatusTransition("ready", "preparing")).toBe(false);
    // READY -> PENDING must fail
    expect(isValidStatusTransition("ready", "pending")).toBe(false);
    // SERVED -> PREPARING must fail
    expect(isValidStatusTransition("served", "preparing")).toBe(false);
    // SERVED -> PENDING must fail
    expect(isValidStatusTransition("served", "pending")).toBe(false);
    // CANCELLED -> READY must fail
    expect(isValidStatusTransition("cancelled", "ready")).toBe(false);
  });

  it("computes the correct next status in sequence", () => {
    expect(nextKitchenStatus("pending")).toBe("confirmed");
    expect(nextKitchenStatus("confirmed")).toBe("preparing");
    expect(nextKitchenStatus("preparing")).toBe("ready");
    expect(nextKitchenStatus("ready")).toBe("served");
    expect(nextKitchenStatus("served")).toBeNull();
    expect(nextKitchenStatus("cancelled")).toBeNull();
  });
});

describe("KDS Board Columns & Status Mapping", () => {
  it("has exactly 4 designated KDS board columns", () => {
    expect(KITCHEN_BOARD_COLUMNS).toEqual([
      "new",
      "accepted",
      "preparing",
      "ready",
    ]);
  });

  it("maps order statuses to appropriate columns", () => {
    expect(KITCHEN_STATUS_TO_COLUMN.pending).toBe("new");
    expect(KITCHEN_STATUS_TO_COLUMN.confirmed).toBe("accepted");
    expect(KITCHEN_STATUS_TO_COLUMN.preparing).toBe("preparing");
    expect(KITCHEN_STATUS_TO_COLUMN.ready).toBe("ready");
    expect(KITCHEN_STATUS_TO_COLUMN.served).toBeNull();
    expect(KITCHEN_STATUS_TO_COLUMN.completed).toBeNull();
    expect(KITCHEN_STATUS_TO_COLUMN.cancelled).toBeNull();
  });
});

describe("KDS Urgency & Timer Calculations", () => {
  it("classifies urgency based on waiting duration", () => {
    // < 10 mins -> normal
    expect(calculateUrgency(5 * 60 * 1000)).toBe("normal");
    // 10 - 20 mins -> warning
    expect(calculateUrgency(12 * 60 * 1000)).toBe("warning");
    // > 20 mins -> critical
    expect(calculateUrgency(25 * 60 * 1000)).toBe("critical");
  });

  it("formats elapsed time properly", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(65 * 1000)).toBe("01:05");
    expect(formatElapsed(600 * 1000)).toBe("10:00");
    expect(formatElapsed(3660 * 1000)).toBe("1h 01m");
  });
});

describe("KDS Multi-Tenant & Branch Channel Scoping", () => {
  it("generates isolated channel keys scoped to tenant and branch", () => {
    const channel1 = buildKitchenChannel("rest_A", "branch_1");
    const channel2 = buildKitchenChannel("rest_B", "branch_1");
    const channelGlobal = buildKitchenChannel("rest_A", null);

    expect(channel1).toBe("restaurant:rest_A:branch:branch_1");
    expect(channel2).toBe("restaurant:rest_B:branch:branch_1");
    expect(channelGlobal).toBe("restaurant:rest_A:branch:all");

    // Cross-tenant channel isolation
    expect(channel1).not.toBe(channel2);
  });
});

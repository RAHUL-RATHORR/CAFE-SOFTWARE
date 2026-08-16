import { describe, expect, it } from "vitest";
import {
  buildBulkTablePreview,
  classifyQrLifecycle,
} from "@/lib/table-qr";
import {
  buildPublicTableQrPath,
  buildPublicTableQrUrl,
  createOpaqueQrToken,
} from "@/lib/qr-code";

describe("opaque QR tokens", () => {
  it("creates cryptographically long opaque tokens without IDs", () => {
    const token = createOpaqueQrToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).not.toMatch(/restaurant/i);
    expect(token).not.toMatch(/ObjectId/i);
    expect(buildPublicTableQrPath(token)).toBe(
      `/order/${encodeURIComponent(token)}`
    );
    expect(buildPublicTableQrUrl(token, "https://app.example")).toBe(
      `https://app.example/order/${encodeURIComponent(token)}`
    );
  });

  it("classifies QR validation states", () => {
    expect(
      classifyQrLifecycle({
        qrActive: true,
        expired: false,
        tableActive: true,
        tableOutOfService: false,
        branchActive: true,
        restaurantFound: true,
      })
    ).toBe("valid");

    expect(
      classifyQrLifecycle({
        qrActive: false,
        expired: false,
        tableActive: true,
        tableOutOfService: false,
        branchActive: true,
        restaurantFound: true,
      })
    ).toBe("revoked");

    expect(
      classifyQrLifecycle({
        qrActive: true,
        expired: true,
        tableActive: true,
        tableOutOfService: false,
        branchActive: true,
        restaurantFound: true,
      })
    ).toBe("revoked");

    expect(
      classifyQrLifecycle({
        qrActive: true,
        expired: false,
        tableActive: false,
        tableOutOfService: false,
        branchActive: true,
        restaurantFound: true,
      })
    ).toBe("table_unavailable");

    expect(
      classifyQrLifecycle({
        qrActive: true,
        expired: false,
        tableActive: true,
        tableOutOfService: false,
        branchActive: false,
        restaurantFound: true,
      })
    ).toBe("branch_unavailable");
  });
});

describe("bulk table preview", () => {
  it("separates creatable and conflicting labels", () => {
    const preview = buildBulkTablePreview({
      prefix: "T",
      startNumber: 1,
      count: 3,
      capacity: 4,
      existingNumbers: new Set(["T2"]),
    });

    expect(preview.requestedCount).toBe(3);
    expect(preview.creatable.map((row) => row.tableNumber)).toEqual([
      "T1",
      "T3",
    ]);
    expect(preview.conflicting.map((row) => row.tableNumber)).toEqual(["T2"]);
    expect(preview.conflicting[0]?.reason).toMatch(/already exists/i);
  });
});

describe("default branch exclusivity helper", () => {
  it("only one main branch flag should remain true when setting default", () => {
    const branches = [
      { id: "a", isMainBranch: true },
      { id: "b", isMainBranch: false },
      { id: "c", isMainBranch: false },
    ];

    const nextDefaultId = "b";
    const updated = branches.map((branch) => ({
      ...branch,
      isMainBranch: branch.id === nextDefaultId,
    }));

    expect(updated.filter((branch) => branch.isMainBranch)).toHaveLength(1);
    expect(updated.find((branch) => branch.id === "b")?.isMainBranch).toBe(
      true
    );
  });
});

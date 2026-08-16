import { describe, expect, it } from "vitest";
import { sanitizeText } from "@/lib/security";

describe("guest note sanitization", () => {
  it("strips HTML-like markup from guest notes and names", () => {
    expect(sanitizeText('<script>alert(1)</script>Extra spicy')).toBe(
      "alert(1)Extra spicy"
    );
    expect(sanitizeText("Hello <b>Guest</b>")).toBe("Hello Guest");
  });
});

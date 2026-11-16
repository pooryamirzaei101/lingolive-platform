import { hashToken, newOpaqueToken } from "../src/auth/token";

describe("opaque auth tokens", () => {
  it("creates high-entropy non-repeating tokens", () => {
    const first = newOpaqueToken();
    const second = newOpaqueToken();
    expect(first).toHaveLength(43);
    expect(second).not.toBe(first);
  });
  it("hashes deterministically without storing the raw token", () => {
    const token = newOpaqueToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toContain(token);
  });
});

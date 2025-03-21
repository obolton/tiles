import { describe, it, expect } from "vitest";
import { validateDestination } from "../destinations";

describe("validateDestination", () => {
  it("should accept valid paths", () => {
    expect(validateDestination("invites/accept/abc-DEF123_")).toBe(true);
  });

  it("should reject invalid paths", () => {
    expect(validateDestination("")).toBe(false);
    expect(validateDestination("/")).toBe(false);
    expect(validateDestination("invalid/path")).toBe(false);
    expect(validateDestination("invites/accept/")).toBe(false);
    expect(validateDestination("invites/accept/abc/abc")).toBe(false);
    expect(validateDestination("/invites/accept/abc")).toBe(false);
    expect(validateDestination("invites/accept/abc!")).toBe(false);
    expect(validateDestination("invites/accept/abc def")).toBe(false);
    expect(validateDestination("INVITES/accept/abc")).toBe(false);
  });
});

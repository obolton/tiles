import { describe, test, expect } from "vitest";
import { validateDestination } from "../destinations";

describe("validateDestination", () => {
  test("accepts valid paths", () => {
    expect(validateDestination("invites/accept/abc-DEF123_")).toBe(true);
    expect(validateDestination("invites/join-workspace/abc-DEF123_")).toBe(true);
  });

  test("rejects invalid paths", () => {
    expect(validateDestination("")).toBe(false);
    expect(validateDestination("/")).toBe(false);
    expect(validateDestination("invalid/path")).toBe(false);
    expect(validateDestination("invites/accept/")).toBe(false);
    expect(validateDestination("invites/accept/abc/abc")).toBe(false);
    expect(validateDestination("/invites/accept/abc")).toBe(false);
    expect(validateDestination("invites/accept/abc!")).toBe(false);
    expect(validateDestination("invites/accept/abc def")).toBe(false);
    expect(validateDestination("INVITES/accept/abc")).toBe(false);
    expect(validateDestination("invites/join-workspace/")).toBe(false);
    expect(validateDestination("invites/other/abc")).toBe(false);
  });
});

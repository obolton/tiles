import { describe, test, expect } from "vitest";
import {
  validateDestination,
  getDestination,
  getPathDestination,
  withDestination,
} from "../destinations";

const PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";
const WORKSPACE_ID = "31042e0b-f7e7-4fe1-a361-28780bf53ee9";

describe("validateDestination", () => {
  test("accepts invite paths", () => {
    expect(validateDestination("invites/accept/abc-DEF123_")).toBe(true);
    expect(validateDestination("invites/join-workspace/abc-DEF123_")).toBe(true);
  });

  test("accepts page paths", () => {
    expect(validateDestination(`pages/${PAGE_ID}`)).toBe(true);
  });

  test("accepts workspace paths", () => {
    expect(validateDestination(`workspaces/${WORKSPACE_ID}`)).toBe(true);
    expect(validateDestination(`workspaces/${WORKSPACE_ID}/shared`)).toBe(true);
    expect(validateDestination(`workspaces/${WORKSPACE_ID}/folders/${PAGE_ID}`)).toBe(true);
    expect(validateDestination(`workspaces/${WORKSPACE_ID}/settings/workspace/members`)).toBe(true);
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
    expect(validateDestination("pages/not-a-uuid")).toBe(false);
    expect(validateDestination(`pages/${PAGE_ID}/edit`)).toBe(false);
    expect(validateDestination(`pages/${PAGE_ID}?version=1`)).toBe(false);
    expect(validateDestination("workspaces/not-a-uuid")).toBe(false);
    expect(validateDestination(`workspaces/${WORKSPACE_ID}/a/b/c/d`)).toBe(false);
    expect(validateDestination(`workspaces/${WORKSPACE_ID}//evil.com`)).toBe(false);
    expect(validateDestination("sign-in")).toBe(false);
  });
});

describe("getDestination", () => {
  test("returns a valid destination parameter", () => {
    const url = new URL(
      `http://localhost/sign-in?destination=${encodeURIComponent(`pages/${PAGE_ID}`)}`,
    );
    expect(getDestination(url)).toBe(`pages/${PAGE_ID}`);
  });

  test("returns null for a missing or invalid destination", () => {
    expect(getDestination(new URL("http://localhost/sign-in"))).toBeNull();
    expect(getDestination(new URL("http://localhost/sign-in?destination="))).toBeNull();
    expect(
      getDestination(new URL("http://localhost/sign-in?destination=https://evil.com")),
    ).toBeNull();
  });
});

describe("getPathDestination", () => {
  test("converts a valid pathname", () => {
    expect(getPathDestination(`/pages/${PAGE_ID}`)).toBe(`pages/${PAGE_ID}`);
  });

  test("returns null for other pathnames", () => {
    expect(getPathDestination("/")).toBeNull();
    expect(getPathDestination("/sign-in")).toBeNull();
  });
});

describe("withDestination", () => {
  test("appends an encoded destination parameter", () => {
    expect(withDestination("/sign-in", `pages/${PAGE_ID}`)).toBe(
      `/sign-in?destination=pages%2F${PAGE_ID}`,
    );
  });

  test("returns the path unchanged without a destination", () => {
    expect(withDestination("/sign-in", null)).toBe("/sign-in");
  });
});

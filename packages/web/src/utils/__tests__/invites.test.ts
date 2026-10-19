import { describe, expect, test } from "vitest";
import { getPageInviteUrl, getWorkspaceInviteUrl } from "../invites";

describe("getPageInviteUrl", () => {
  test("builds the accept URL for a page invite key", () => {
    expect(getPageInviteUrl("abc_-123", "https://tiles.test")).toBe(
      "https://tiles.test/invites/accept/abc_-123",
    );
  });

  test("defaults to the current origin", () => {
    expect(getPageInviteUrl("key")).toBe(`${location.origin}/invites/accept/key`);
  });
});

describe("getWorkspaceInviteUrl", () => {
  test("builds the join URL for a workspace invite key", () => {
    expect(getWorkspaceInviteUrl("abc_-123", "https://tiles.test")).toBe(
      "https://tiles.test/invites/join-workspace/abc_-123",
    );
  });
});

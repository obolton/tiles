import { describe, expect, test } from "vitest";
import { signUpEmail } from "../signUp";
import { inviteToPageEmail } from "../inviteToPage";
import { inviteToWorkspaceEmail } from "../inviteToWorkspace";

const UNSAFE_NAME = `<script>alert("x")</script> & O'Co`;
const ESCAPED_NAME = "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; O&apos;Co";
const INVITER = { id: "user-1", name: UNSAFE_NAME };
const KEY = "abc123_-XYZ";

describe("signUpEmail", () => {
  test("escapes the user's name", () => {
    const { subject, body } = signUpEmail({
      id: "user-1",
      name: UNSAFE_NAME,
      workspaceId: "workspace-1",
    });

    expect(subject).toBe("Welcome to Tiles");
    expect(body).toContain(`<p>Hi ${ESCAPED_NAME},</p>`);
    expect(body).not.toContain("<script>");
    expect(body).toContain('href="https://test.example.com"');
  });

  test("links to the user's workspace", () => {
    const { body } = signUpEmail({ id: "user-1", name: "Ada", workspaceId: "workspace-1" });

    expect(body).toContain('href="https://test.example.com/workspaces/workspace-1"');
    expect(body).not.toContain("/library");
  });
});

describe("inviteToPageEmail", () => {
  test("escapes the inviter's name and page title", () => {
    const { body } = inviteToPageEmail({ inviter: INVITER, title: `"Q1" <plan> & more`, key: KEY });

    expect(body).toContain(`<strong>${ESCAPED_NAME}</strong>`);
    expect(body).toContain("&quot;Q1&quot; &lt;plan&gt; &amp; more");
    expect(body).not.toContain("<script>");
    expect(body).toContain(`href="https://test.example.com/invites/accept/${KEY}"`);
  });

  test("keeps the subject as plain text", () => {
    const { subject } = inviteToPageEmail({ inviter: INVITER, title: "Plan & more", key: KEY });

    expect(subject).toBe(`${UNSAFE_NAME} has invited you to collaborate on "Plan & more"`);
  });
});

describe("inviteToWorkspaceEmail", () => {
  test("escapes the inviter's name and workspace name", () => {
    const { body } = inviteToWorkspaceEmail({
      inviter: INVITER,
      workspaceName: "<b>Acme</b> & Sons",
      key: KEY,
    });

    expect(body).toContain(`<strong>${ESCAPED_NAME}</strong>`);
    expect(body).toContain("join the &lt;b&gt;Acme&lt;/b&gt; &amp; Sons workspace");
    expect(body).not.toContain("<script>");
    expect(body).toContain(`href="https://test.example.com/invites/join-workspace/${KEY}"`);
  });

  test("keeps the subject as plain text", () => {
    const { subject } = inviteToWorkspaceEmail({
      inviter: INVITER,
      workspaceName: "Acme & Sons",
      key: KEY,
    });

    expect(subject).toBe(`${UNSAFE_NAME} has invited you to Acme & Sons on Tiles`);
  });
});

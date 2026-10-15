import { describe, expect, test } from "vitest";
import { renderToString } from "@/jsx/server";
import Profile from "../Profile";
import type { ProfileProps } from "../Profile";

function createUser(imageUrl: string | null): ProfileProps["user"] {
  return {
    id: "user-1",
    username: null,
    name: "Test User",
    email: "test@test.com",
    imageKey: imageUrl ? "image-1" : null,
    imageUrl,
    workspaces: [{ id: "workspace-1", name: "Test Workspace" }],
  };
}

function renderProfileImage(imageUrl: string | null) {
  const html = renderToString(
    <Profile workspaceId="workspace-1" user={createUser(imageUrl)} isAdmin={false} />,
  );
  const container = document.createElement("div");
  container.innerHTML = html;
  const filePicker = container.querySelector("file-picker");
  expect(filePicker).not.toBeNull();
  return filePicker;
}

describe("Profile", () => {
  test("renders the profile image at the large size", () => {
    const filePicker = renderProfileImage("https://profile-images.test/image-1?class=small");
    const image = filePicker?.querySelector("img");
    expect(image?.getAttribute("src")).toBe("https://profile-images.test/image-1?class=large");
    expect(image?.getAttribute("alt")).toBe("Test User");
  });

  test("renders the initial when the user has no profile image", () => {
    const filePicker = renderProfileImage(null);
    expect(filePicker?.querySelector("img")).toBeNull();
    expect(filePicker?.textContent).toBe("T");
  });

  test("shows the tooltip for both image states", () => {
    for (const imageUrl of ["https://profile-images.test/image-1", null]) {
      const filePicker = renderProfileImage(imageUrl);
      expect(filePicker?.getAttribute("data-tooltip")).toBe("Select a new profile image");
    }
  });
});

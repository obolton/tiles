import "@/styles";
import "@/elements/menu/PopoverMenu";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import Header from "../Header";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import type { JSX } from "jsx/jsx";
import type { User } from "@/utils/sessions";

const WORKSPACE_NAME = "A workspace with a long name";

const USER: User = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "ws-1", name: WORKSPACE_NAME }],
};

const TITLE = "A page title that is long enough to need truncating on a phone";

function renderHeader(actions: JSX.Node) {
  const nodes = render(
    <Header user={USER} workspaceId="ws-1" center={<h1>{TITLE}</h1>} actions={actions} stacked />,
  );
  document.body.append(...nodes);
}

function compactActions({ editing = false, undoRedo = false } = {}) {
  return (
    <>
      <ToolbarGroup label="Editing">
        <button type="button" className="primary">
          {editing ? "Done" : "Edit"}
        </button>
        {undoRedo ? (
          <>
            <ToolbarButton label="Undo">↶</ToolbarButton>
            <ToolbarButton label="Redo">↷</ToolbarButton>
          </>
        ) : null}
      </ToolbarGroup>
      <ToolbarGroup label="Page actions">
        <ToolbarButton label="More actions">…</ToolbarButton>
      </ToolbarGroup>
    </>
  );
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("Header", () => {
  describe("at phone width", () => {
    const WIDTH = 390;

    test("stacks the title below the navigation and actions", async () => {
      await page.viewport(WIDTH, 844);
      renderHeader(compactActions({ editing: true }));

      const header = page.getByRole("banner").element().getBoundingClientRect();
      const more = page.getByRole("button", { name: "More actions" }).element();
      const title = page.getByRole("heading", { level: 1 }).element().getBoundingClientRect();

      expect(header.height).toBe(104);
      expect(more.getBoundingClientRect().right).toBeLessThanOrEqual(WIDTH);
      expect(title.top).toBeGreaterThanOrEqual(more.getBoundingClientRect().bottom);
      expect(title.right).toBeLessThanOrEqual(WIDTH);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(WIDTH);
    });

    test("truncates the workspace name rather than overflowing", async () => {
      await page.viewport(WIDTH, 844);
      renderHeader(compactActions({ editing: true }));

      const name = page.getByRole("button", { name: WORKSPACE_NAME }).element().lastElementChild;
      expect(name?.getBoundingClientRect().width).toBeGreaterThan(40);
      expect(name && name.scrollWidth > name.clientWidth).toBe(true);
      expect(
        page.getByRole("button", { name: "More actions" }).element().getBoundingClientRect().right,
      ).toBeLessThanOrEqual(WIDTH);
    });
  });

  describe("at tablet width", () => {
    test("keeps a single row and truncates the title between the groups", async () => {
      await page.viewport(768, 1024);
      renderHeader(compactActions({ editing: true, undoRedo: true }));

      const title = page.getByRole("heading", { level: 1 }).element();
      const workspace = page.getByRole("button", { name: WORKSPACE_NAME }).element();
      const done = page.getByRole("button", { name: "Done" }).element();

      expect(page.getByRole("banner").element().getBoundingClientRect().height).toBe(56);
      expect(title.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        workspace.getBoundingClientRect().right,
      );
      expect(title.getBoundingClientRect().right).toBeLessThanOrEqual(
        done.getBoundingClientRect().left,
      );
      expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    });
  });

  describe("workspace menu", () => {
    test("offers a new page of each type below the library", async () => {
      renderHeader(compactActions());
      await page.getByRole("button", { name: WORKSPACE_NAME }).click();

      const items = page
        .getByRole("menuitem")
        .elements()
        .map((item) => item.textContent);
      expect(items.slice(0, 4)).toEqual([
        "Library",
        "New document",
        "New presentation",
        "New layout",
      ]);
      await expect.element(page.getByRole("group", { name: "New page" })).toBeVisible();
    });
  });
});

import "@/styles";
import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import Header from "../Header";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import type { JSX } from "jsx/jsx";
import type { User } from "@/utils/sessions";

const USER: User = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "ws-1", name: "A workspace with a long name" }],
};

const TITLE = "A page title that is long enough to need truncating on a phone";

function renderHeader(actions: JSX.Node) {
  const nodes = render(
    <Header user={USER} workspaceId="ws-1" center={<h1>{TITLE}</h1>} actions={actions} stacked />,
  );
  document.body.append(...nodes);
}

function viewActions() {
  return (
    <>
      <ToolbarGroup label="Editing">
        <button type="button" className="primary">
          Edit
        </button>
      </ToolbarGroup>
      <ToolbarGroup label="Page actions">
        <ToolbarButton label="More actions">…</ToolbarButton>
      </ToolbarGroup>
    </>
  );
}

function editActions() {
  return (
    <>
      <ToolbarGroup label="Editing">
        <button type="button" className="primary">
          Done
        </button>
        <ToolbarButton label="Undo">↶</ToolbarButton>
        <ToolbarButton label="Redo">↷</ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup label="Page actions">
        <ToolbarButton label="More actions">…</ToolbarButton>
      </ToolbarGroup>
    </>
  );
}

function rectOf(selector: string) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element.getBoundingClientRect();
}

function workspaceName() {
  const name = document.querySelector('[popovertarget="navigation-menu"] span:last-child');
  if (!name) {
    throw new Error("Missing workspace name");
  }
  return name;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("Header", () => {
  describe("at phone width", () => {
    const WIDTH = 390;

    test("stacks the title below the navigation and actions", async () => {
      await page.viewport(WIDTH, 844);
      renderHeader(editActions());

      const more = rectOf('[aria-label="More actions"]');
      const title = rectOf("#header h1");

      expect(rectOf("#header").height).toBe(104);
      expect(more.right).toBeLessThanOrEqual(WIDTH);
      expect(title.top).toBeGreaterThanOrEqual(more.bottom);
      expect(title.right).toBeLessThanOrEqual(WIDTH);
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(WIDTH);
    });

    test("hides the workspace name when the actions leave no room for it", async () => {
      await page.viewport(WIDTH, 844);
      renderHeader(editActions());

      expect(workspaceName().getBoundingClientRect().width).toBeLessThanOrEqual(1);
      expect(rectOf('[popovertarget="new-page-menu"]').right).toBeLessThan(
        rectOf("button.primary").left,
      );
    });

    test("keeps a truncated workspace name when there is room", async () => {
      await page.viewport(WIDTH, 844);
      renderHeader(viewActions());

      const name = workspaceName();
      expect(name.getBoundingClientRect().width).toBeGreaterThan(40);
      expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    });
  });

  describe("at tablet width", () => {
    test("keeps a single row and truncates the title between the groups", async () => {
      await page.viewport(768, 1024);
      renderHeader(editActions());

      const title = document.querySelector("#header h1");
      const titleRect = rectOf("#header h1");
      const newPage = rectOf('[popovertarget="new-page-menu"]');
      const done = rectOf("button.primary");

      expect(rectOf("#header").height).toBe(56);
      expect(titleRect.left).toBeGreaterThanOrEqual(newPage.right);
      expect(titleRect.right).toBeLessThanOrEqual(done.left);
      expect(title && title.scrollWidth > title.clientWidth).toBe(true);
    });
  });
});

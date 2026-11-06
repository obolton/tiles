import { afterEach, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import LibraryPage from "../LibraryPage";
import type { LibraryPage as LibraryPageItem } from "@/components/library/LibraryCard";
import type { User } from "@/utils/sessions";

const USER: User = {
  id: "user-1",
  name: "Jane Smith",
  username: "jane",
  email: "jane@example.com",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "ws-1", name: "Personal" }],
};

const FOLDERS = {
  folders: Array.from({ length: 6 }, (_, index) => ({
    id: `folder-${index}`,
    name: `Folder ${index + 1} with a long name`,
  })),
  nextCursor: null,
};

const PAGES: LibraryPageItem[] = Array.from({ length: 5 }, (_, index) => ({
  id: `page-${index}`,
  title: `Page ${index + 1}`,
  type: "DOCUMENT",
  updatedAt: "2025-01-01T00:00:00.000Z",
  published: index === 0,
  folderId: null,
  folder: null,
  author: { id: USER.id, name: USER.name, imageUrl: null },
}));

function renderLibrary() {
  const nodes = render(
    <LibraryPage
      workspace={{ id: "ws-1" }}
      folders={FOLDERS}
      selectedFolderId="RECENT"
      pages={{ pages: PAGES, nextCursor: null }}
      user={USER}
      placeholder="Search pages"
      emptyMessage="No pages"
      search={() => Promise.resolve({ pages: [], nextCursor: null })}
    />,
  );
  document.body.append(...nodes);
}

function rectOf(selector: string, index = 0) {
  const element = document.querySelectorAll(selector)[index];
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element.getBoundingClientRect();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("LibraryPage", () => {
  describe("at phone width", () => {
    const WIDTH = 390;

    test("stacks the search toolbar below the navigation in the header", async () => {
      await page.viewport(WIDTH, 844);
      renderLibrary();

      const newPage = rectOf('[popovertarget="new-page-menu"]');
      const search = rectOf("#search-pages");
      const sort = rectOf("list-select");

      expect(search.top).toBeGreaterThanOrEqual(newPage.bottom);
      expect(sort.right).toBeLessThanOrEqual(WIDTH);
      expect(rectOf("#header").height).toBe(104);
      expect(getComputedStyle(document.querySelector("main") ?? document.body).marginTop).toBe(
        "104px",
      );
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(WIDTH);
    });

    test("lays the folder navigation out as a horizontal row", async () => {
      await page.viewport(WIDTH, 844);
      renderLibrary();

      const first = rectOf("main .navigation-menu > li", 0);
      const second = rectOf("main .navigation-menu > li", 1);

      expect(second.top).toBe(first.top);
      expect(second.left).toBeGreaterThan(first.right);
    });

    test("shows pages in two columns", async () => {
      await page.viewport(WIDTH, 844);
      renderLibrary();

      const first = rectOf("article[data-id]", 0);
      const second = rectOf("article[data-id]", 1);
      const third = rectOf("article[data-id]", 2);

      expect(second.top).toBe(first.top);
      expect(second.left).toBeGreaterThan(first.right);
      expect(second.right).toBeLessThanOrEqual(WIDTH);
      expect(third.top).toBeGreaterThan(first.bottom);
    });
  });

  describe("at desktop width", () => {
    test("keeps the folder navigation beside the pages", async () => {
      await page.viewport(1280, 800);
      renderLibrary();

      const first = rectOf("main .navigation-menu > li", 0);
      const second = rectOf("main .navigation-menu > li", 1);
      const card = rectOf("article[data-id]");

      expect(second.top).toBeGreaterThan(first.bottom);
      expect(card.left).toBeGreaterThan(first.right);
      expect(rectOf("#header").height).toBe(56);
    });
  });
});

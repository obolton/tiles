import "@/styles";
import "@/elements/menu/PopoverMenu";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import HeaderActions from "../HeaderActions";
import { createEditor } from "@/test/editor";

function renderActions() {
  const editor = createEditor({ editable: false });
  document.body.append(...render(<HeaderActions editor={editor} />));
}

async function openMenu() {
  await page.getByRole("button", { name: "More actions" }).click();
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("HeaderActions", () => {
  describe("page actions menu", () => {
    test("offers the export on a wide screen, where the other actions are buttons", async () => {
      await page.viewport(1280, 800);
      renderActions();
      await openMenu();

      await expect
        .element(page.getByRole("menuitem", { name: "Export as Markdown" }))
        .toBeVisible();
      expect(page.getByRole("menuitemcheckbox", { name: "Bookmark" }).query()).toBeNull();
      expect(page.getByRole("menuitem", { name: "Present" }).query()).toBeNull();
      await expect.element(page.getByRole("button", { name: "Present" })).toBeVisible();
    });

    test("collects every action on a phone", async () => {
      await page.viewport(390, 844);
      renderActions();
      await openMenu();

      await expect.element(page.getByRole("menuitemcheckbox", { name: "Bookmark" })).toBeVisible();
      await expect.element(page.getByRole("menuitem", { name: "Present" })).toBeVisible();
      await expect
        .element(page.getByRole("menuitem", { name: "Export as Markdown" }))
        .toBeVisible();
    });

    test("downloads the page as Markdown", async () => {
      await page.viewport(1280, 800);
      const downloads: string[] = [];
      vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
        this: HTMLAnchorElement,
      ) {
        downloads.push(this.download);
      });
      renderActions();
      await openMenu();

      await page.getByRole("menuitem", { name: "Export as Markdown" }).click();

      expect(downloads).toEqual(["Test Page.md"]);
    });
  });
});

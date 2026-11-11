import "@/styles";
import "@/elements/item/PageItem";
import "@/elements/scroll-view/ScrollView";
import { afterEach, describe, expect, test, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "jsx/dom";
import { reactive } from "carillon";
import LayoutPage from "../LayoutPage";
import SectionItems from "@/components/toolbars/insert/SectionItems";
import { createEditor } from "@/test/editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

function renderPage() {
  const editor = createEditor();
  for (const id of ["insert-slot", "toolbar-slot"]) {
    const slot = document.createElement("div");
    slot.id = id;
    document.body.append(slot);
  }
  document.body.append(
    ...render(
      <LayoutPage
        page={editor.page}
        isEditable={reactive(true)}
        showToolbar={reactive(false)}
        tiles={editor.page.tiles}
      />,
    ),
    ...render(<SectionItems getPlacement={() => editor.rootPlacement} />),
  );
  return editor;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("LayoutPage", () => {
  test.each(["Grid", "Horizontal", "Vertical"])(
    "renders an inserted %s section at its default height",
    async (name) => {
      await page.viewport(1280, 800);
      const editor = renderPage();

      await page.getByRole("menuitem", { name, exact: true }).click();

      const item = await vi.waitFor(() => {
        const [tile] = editor.page.tiles.value;
        const element = tile && document.getElementById(tile.id);
        if (!element) {
          throw new Error("Missing inserted section");
        }
        return element;
      });
      expect(item.getBoundingClientRect().height).toBe(15 * 24);
    },
  );
});

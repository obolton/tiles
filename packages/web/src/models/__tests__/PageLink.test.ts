import { beforeEach, describe, expect, test, vi } from "vitest";
import PageLink, { type CreatePageLinkInput } from "@/models/PageLink";
import { createEditor } from "@/test/editor";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

const LINKED_PAGE = {
  id: "linked-page-id",
  title: "Linked Page",
  background: null,
  font: "CLASSIC" as const,
};

describe("PageLink", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = createEditor();
  });

  function createPageLink(overrides: Partial<CreatePageLinkInput> = {}): PageLink {
    return editor.page.createTile(
      PageLink.createMap({ linkedPage: LINKED_PAGE, ...overrides }),
      {},
    ) as PageLink;
  }

  test("maps properties to reactive values", () => {
    const pageLink = createPageLink();

    expect(pageLink.type).toBe("PAGE_LINK");
    expect(pageLink.linkedPage.value).toEqual(LINKED_PAGE);
  });
});

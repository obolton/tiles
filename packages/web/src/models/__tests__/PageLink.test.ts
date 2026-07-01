import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import PageLink, { type CreatePageLinkInput } from "@/models/PageLink";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";

const LINKED_PAGE = {
  id: "linked-page-id",
  title: "Linked Page",
  background: null,
  font: "CLASSIC" as const,
};

describe("PageLink", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

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

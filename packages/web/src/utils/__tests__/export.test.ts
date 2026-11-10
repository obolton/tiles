import { describe, expect, test, vi } from "vitest";
import type * as Y from "yjs";
import { getBody } from "doc/body";
import { insertTile } from "doc/richText/tiles";
import { appendParagraph, placeTile } from "doc/test/tiles";
import { buildImageMap } from "doc/tiles/image";
import { buildPageLinkMap } from "doc/tiles/pageLink";
import { createEditor } from "@/test/editor";
import { downloadFile } from "@/utils/download";
import { handleError } from "@/utils/errors";
import { exportPageAsMarkdown, toMarkdownFilename } from "@/utils/export";
import { showToast } from "@/utils/toasts";

vi.mock("@/utils/download");
vi.mock("@/utils/toasts");
vi.mock("@/utils/errors");

describe("toMarkdownFilename", () => {
  test.each([
    ["Quarterly report", "Quarterly report.md"],
    ["  Spaced \n out  ", "Spaced out.md"],
    ['Plans: 2026/Q1 "draft"?', "Plans 2026Q1 draft.md"],
    ["...hidden...", "hidden.md"],
    ["", "Untitled.md"],
    ["***", "Untitled.md"],
  ])("names %j as %j", (title, expected) => {
    expect(toMarkdownFilename(title)).toBe(expected);
  });

  test("caps the length of the name", () => {
    expect(toMarkdownFilename("a".repeat(150))).toBe(`${"a".repeat(100)}.md`);
  });
});

describe("exportPageAsMarkdown", () => {
  test("downloads the page as Markdown named after its title", () => {
    const { page } = createEditor({
      editable: false,
      page: { type: "DOCUMENT", title: "Hello / World" },
    });
    const body = getBody(page.doc);
    const tiles = page.doc.getMap<Y.Map<unknown>>("tiles");
    appendParagraph(body, "Intro");
    placeTile(tiles, "img", buildImageMap({ imageId: "img-1", size: { width: 1, height: 1 } }));
    insertTile(body, "img");
    placeTile(tiles, "link", buildPageLinkMap({ linkedPage: { id: "p2", title: "Next" } }));
    insertTile(body, "link");

    exportPageAsMarkdown(page);

    expect(downloadFile).toHaveBeenCalledWith(
      `# Hello / World\n\nIntro\n\n![](https://images.test/img-1?optimizer=image&class=large)\n\n[Next](${location.origin}/pages/p2)\n`,
      "Hello World.md",
      "text/markdown;charset=utf-8",
    );
    expect(showToast).toHaveBeenCalledWith("Downloaded Hello World.md", "success");
  });

  test("reports a failed download", () => {
    vi.mocked(downloadFile).mockImplementationOnce(() => {
      throw new Error("Blocked");
    });
    const { page } = createEditor({ editable: false });

    exportPageAsMarkdown(page);

    expect(handleError).toHaveBeenCalledWith(expect.any(Error));
    expect(showToast).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, test, vi } from "vitest";
import { downloadFile } from "@/utils/download";

describe("downloadFile", () => {
  let clicked: HTMLAnchorElement[] = [];

  beforeEach(() => {
    clicked = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });
  });

  test("clicks a temporary link that downloads the content", () => {
    downloadFile("# Title", "Title.md", "text/markdown");

    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.download).toBe("Title.md");
    expect(clicked[0]?.href).toBe("data:text/markdown,%23%20Title");
    expect(clicked[0]?.isConnected).toBe(false);
  });
});

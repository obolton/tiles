import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { downloadFile } from "@/utils/download";

describe("downloadFile", () => {
  const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:test");
  const revokeObjectURL = vi.fn<(url: string) => void>();
  let clicked: HTMLAnchorElement[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    clicked = [];
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(URL, "createObjectURL");
    Reflect.deleteProperty(URL, "revokeObjectURL");
  });

  test("clicks a temporary link that downloads the content", async () => {
    downloadFile("# Title", "Title.md", "text/markdown");

    expect(clicked).toHaveLength(1);
    expect(clicked[0]?.download).toBe("Title.md");
    expect(clicked[0]?.href).toBe("blob:test");
    expect(clicked[0]?.isConnected).toBe(false);

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob?.type).toBe("text/markdown");
    await expect(blob?.text()).resolves.toBe("# Title");
  });

  test("revokes the object URL once the click has been handled", () => {
    downloadFile("x", "x.txt", "text/plain");
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});

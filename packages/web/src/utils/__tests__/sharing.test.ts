import { describe, expect, test, vi, beforeAll } from "vitest";
import { sharePage } from "../sharing";

describe("sharePage", () => {
  beforeAll(() => {
    vi.stubGlobal("navigator", {
      share: vi.fn(),
    });
    vi.stubGlobal("window", {
      location: {
        href: "https://test.com",
      },
    });
    vi.stubGlobal("document", {
      title: "Hello World",
    });
  });

  test("calls the browser share API with the expected values", async () => {
    await sharePage();
    expect(navigator.share).toHaveBeenCalledWith({
      url: "https://test.com",
      title: "Hello World",
    });
  });
});

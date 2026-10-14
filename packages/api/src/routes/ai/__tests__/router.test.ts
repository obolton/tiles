import { vi } from "vitest";
import { generateImage, write } from "../ai";
import { describeRouter } from "@/test/router";
import { PAGE_ID } from "@/test/mocks/middleware";

vi.mock("../ai");
vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

describeRouter("ai", {
  generateImage: {
    guard: "authenticated",
    handler: generateImage,
    input: { prompt: "A cat" },
    args: (input) => [input],
    invalid: { prompt: "" },
  },
  write: {
    guard: "pageUpdate",
    handler: write,
    input: { pageId: PAGE_ID, sectionId: null, prompt: "Write an introduction" },
    args: (input, ctx) => [input, ctx, undefined],
    invalid: { pageId: PAGE_ID, sectionId: null, prompt: "short" },
  },
});

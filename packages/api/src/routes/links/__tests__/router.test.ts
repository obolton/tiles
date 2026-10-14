import { vi } from "vitest";
import { resolveLinkMetadata } from "@/routes/links/links";
import { describeRouter } from "@/test/procedures";
import { PAGE_ID } from "@/test/mocks/middleware";

vi.mock("@/routes/links/links");
vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

describeRouter("externalLinks", {
  getMetadata: {
    guard: "pageUpdate",
    handler: resolveLinkMetadata,
    input: { pageId: PAGE_ID, url: "https://example.com/" },
    invalid: { pageId: PAGE_ID, url: "not-a-url" },
  },
});

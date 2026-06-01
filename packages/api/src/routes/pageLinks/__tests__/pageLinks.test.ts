import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import { createPageLink } from "../pageLinks.ts";
import { PAGE_LINK_FIELDS, type PageLinkPage, type PageLink } from "../fields";
import type { CreateQuery } from "@/test/prisma.ts";
import { omit } from "@/utils/objects.ts";

const MOCK_PAGE: PageLinkPage = {
  id: "test-page",
  title: "Test Page",
  background: { type: "color", color: "ffff00000000" },
  font: "MODERN",
};

const MOCK_PAGE_LINK: PageLink = {
  id: "test-page-link",
  linkedPage: MOCK_PAGE,
};

const MOCK_PLACEMENT = {
  id: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

vi.mock("@/routes/tiles/tiles.ts", () => ({
  createTile: async () => ({
    type: "PAGE_LINK",
    pageLink: MOCK_PAGE_LINK,
    ...MOCK_PLACEMENT,
  }),
}));

describe("createPageLink", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.pageLinkTile.create<CreateQuery<typeof PAGE_LINK_FIELDS>>,
    ).mockResolvedValue(MOCK_PAGE_LINK);
  });

  it("should return a page link", async () => {
    const result = await createPageLink({
      pageId: "test-page-1",
      sectionId: "test-collection",
      linkedPageId: "test-page-2",
    });

    expect(result).toEqual({
      type: "PAGE_LINK",
      ...MOCK_PLACEMENT,
      ...MOCK_PAGE_LINK,
      linkedPage: {
        ...omit(MOCK_PAGE, ["tiles"]),
      },
    });
  });
});

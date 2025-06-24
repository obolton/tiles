import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import {
  PAGE_LINK_FIELDS,
  createPageLink,
  type PageLinkPage,
  type PageLink,
} from "../pageLinks.ts";
import type { CreateQuery } from "@/test/prisma.ts";
import { omit } from "@/utils/objects.ts";

const MOCK_PAGE: PageLinkPage = {
  id: "test-page",
  title: "Test Page",
  color: { h: 120, c: 0.2, l: 1 },
  font: "MODERN",
  coverImageUrl: "https://example.com/cover.jpg",
  author: {
    id: "test-user",
    name: "Test User",
    imageUrl: "https://example.com/author.jpg",
  },
};

const MOCK_PAGE_LINK: PageLink = {
  id: "test-page-link",
  linkedPage: MOCK_PAGE,
};

const MOCK_PLACEMENT = {
  placementId: "test-tile",
  position: 2,
  rows: 1,
  columns: 1,
};

describe("createPageLink", () => {
  beforeAll(() => {
    vi.mocked(
      prisma.pageLinkTile.create<CreateQuery<typeof PAGE_LINK_FIELDS>>,
    ).mockResolvedValue(MOCK_PAGE_LINK);
    vi.mock("@/routes/tiles/tiles.ts", () => ({
      createTilePlacement: async () => MOCK_PLACEMENT,
    }));
  });

  it("should return a page link", async () => {
    const result = await createPageLink({
      pageId: "test-page-1",
      collectionId: "test-collection",
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

import { describe, it, expect, vi, beforeAll } from "vitest";
import prisma from "@/database/prisma.ts";
import {
  createPageLink,
  type PageLink,
  type PageLinkPage,
} from "../pageLinks.ts";
import { mockCreate } from "../../../../test/prisma.ts";
import type { Tile } from "@prisma/client";
import { omit } from "@/utils/objects.ts";

const MOCK_PAGE: PageLinkPage = {
  id: "2",
  title: "Test Page",
  subtitle: "Subtitle",
  theme: "LIGHT",
  hue: 120,
  font: "MODERN",
  author: {
    id: "3",
    name: "Test User",
    imageKey: "test-image-key",
  },
  tiles: [],
};

const MOCK_PAGE_LINK = {
  id: "1",
  pageId: MOCK_PAGE.id,
  page: MOCK_PAGE,
};

describe("createPageLink", () => {
  beforeAll(() => {
    vi.mocked(prisma.pageLinkTile.create).mockImplementation(
      mockCreate<PageLink>(MOCK_PAGE_LINK),
    );
    vi.mocked(prisma.tile.count).mockResolvedValue(2);
    vi.mocked(prisma.tile.create).mockImplementation(
      mockCreate<Tile>({ id: "2" }),
    );
  });

  it("should return a page link", async () => {
    const result = await createPageLink({
      pageId: "1",
      linkedPageId: "2",
    });

    expect(result).toEqual({
      type: "PAGE_LINK",
      placementId: "2",
      position: 2,
      rows: 1,
      columns: 1,
      ...MOCK_PAGE_LINK,
      page: {
        ...omit(MOCK_PAGE, ["tiles"]),
        imageKey: null,
        author: {
          ...omit(MOCK_PAGE.author, ["imageKey"]),
          imageUrl: "https://example.com/profile-images/test-image-key",
        },
      },
    });
  });
});

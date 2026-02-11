import { afterEach, describe, expect, test, vi } from "vitest";
import Link from "@/models/Link";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { LINK_TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({
  default: {
    externalLinks: {
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Link", () => {
  const editor = Editor.init(PAGE);
  const updateMock = vi.mocked(client.externalLinks.update.mutate);

  afterEach(() => {
    updateMock.mockReset();
  });

  test("maps properties to reactive values", () => {
    const link = new Link(editor.page, LINK_TILE);

    expect(link.url.value).toBe(LINK_TILE.url);
    expect(link.title.value).toBe(LINK_TILE.title);
    expect(link.description.value).toBe(LINK_TILE.description);
    expect(link.siteName.value).toBe(LINK_TILE.siteName);
    expect(link.imageUrl.value).toBe(LINK_TILE.imageUrl);
  });

  test("updates the url and refreshes metadata from the server", async () => {
    const link = new Link(editor.page, LINK_TILE);
    const nextUrl = "https://tiles.dev/updated";
    const nextMetadata = {
      title: "Updated title",
      description: "Updated description",
      siteName: "Updated site",
      imageUrl: "https://tiles.dev/updated-image.png",
    };

    updateMock.mockResolvedValue({
      ...LINK_TILE,
      ...nextMetadata,
      url: nextUrl,
    });

    await link.setUrl(nextUrl);

    expect(updateMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      id: LINK_TILE.id,
      url: nextUrl,
    });
    expect(link.url.value).toBe(nextUrl);
    expect(link.title.value).toBe(nextMetadata.title);
    expect(link.description.value).toBe(nextMetadata.description);
    expect(link.siteName.value).toBe(nextMetadata.siteName);
    expect(link.imageUrl.value).toBe(nextMetadata.imageUrl);
  });
});

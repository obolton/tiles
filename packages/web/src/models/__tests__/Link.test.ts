import { afterEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Link from "@/models/Link";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";

const LINK_PROPS = {
  url: "https://tiles.dev",
  title: "Link title",
  description: "Link description",
  siteName: "Test",
  imageId: "image-id",
};

vi.mock("@/api/client", () => ({
  default: {
    externalLinks: {
      getMetadata: {
        query: vi.fn(),
      },
    },
  },
}));

describe("Link", () => {
  const editor = Editor.init(PAGE, new Y.Doc());
  const getMetadataMock = vi.mocked(client.externalLinks.getMetadata.query);

  afterEach(() => {
    getMetadataMock.mockReset();
  });

  function createLink(): Link {
    return editor.page.createTile(Link.createMap(LINK_PROPS), {}) as Link;
  }

  test("maps properties to reactive values", () => {
    const link = createLink();

    expect(link.url.value).toBe(LINK_PROPS.url);
    expect(link.title.value).toBe(LINK_PROPS.title);
    expect(link.description.value).toBe(LINK_PROPS.description);
    expect(link.siteName.value).toBe(LINK_PROPS.siteName);
    expect(link.imageId.value).toBe(LINK_PROPS.imageId);
  });

  test("serialize", () => {
    const link = createLink();
    const data = link.serialize();

    expect(data.type).toBe("LINK");
    expect(data.url).toBe(LINK_PROPS.url);
    expect(data.title).toBe(LINK_PROPS.title);
    expect(data.description).toBe(LINK_PROPS.description);
    expect(data.siteName).toBe(LINK_PROPS.siteName);
  });

  test("updates the url and refreshes metadata from the server", async () => {
    const link = createLink();
    const nextUrl = "https://tiles.dev/updated";
    const nextMetadata = {
      type: "LINK" as const,
      url: nextUrl,
      title: "Updated title",
      description: "Updated description",
      siteName: "Updated site",
      imageId: "updated-image-id",
    };

    getMetadataMock.mockResolvedValue(nextMetadata);

    await link.setUrl(nextUrl);

    expect(getMetadataMock).toHaveBeenCalledWith({
      pageId: PAGE.id,
      url: nextUrl,
    });
    expect(link.url.value).toBe(nextUrl);
    expect(link.title.value).toBe(nextMetadata.title);
    expect(link.description.value).toBe(nextMetadata.description);
    expect(link.siteName.value).toBe(nextMetadata.siteName);
    expect(link.imageId.value).toBe(nextMetadata.imageId);
  });
});

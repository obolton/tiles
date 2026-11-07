import * as Y from "yjs";
import type { PlacementInput } from "doc/tiles/base";
import Tile, { type CreateTileInput } from "./Tile";
import { buildLinkMap, type LinkMapInput } from "doc/tiles/link";
import { type Reactive } from "reactivity";
import client, { type AppRouterOutputs } from "@/api/client";
import Video from "./Video";
import type Page from "@/models/Page";

type LinkMetadata = AppRouterOutputs["externalLinks"]["getMetadata"];
type LinkPreview = NonNullable<Extract<LinkMetadata, { type: "LINK" }>["preview"]>;

const EMPTY_PREVIEW: LinkPreview = {
  title: null,
  description: null,
  siteName: null,
  imageId: null,
};

export interface LinkPreviewOptions {
  /**
   * Whether to load a preview of the page. Defaults to true; when false, the card shows the URL
   * alone without a request to the page.
   */
  preview?: boolean;
}

export interface CreateLinkInput extends Omit<CreateTileInput, "type">, LinkPreviewOptions {
  url: string;
}

/** Thrown when a URL's page cannot be fetched, so no preview is available for it. */
export class LinkPreviewError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`No preview is available for ${url}`);
    this.name = "LinkPreviewError";
    this.url = url;
  }
}

export default class Link extends Tile {
  readonly type = "LINK";

  readonly url: Reactive<string>;
  readonly title: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly siteName: Reactive<string | null>;
  readonly imageId: Reactive<string | null>;

  static createMap(properties: Omit<LinkMapInput, keyof PlacementInput>): Y.Map<unknown> {
    return buildLinkMap(properties);
  }

  /**
   * Creates a link card for a URL, or a video when the URL is from a supported video provider.
   * Rejects with a `LinkPreviewError` when the page cannot be fetched, unless `preview` is false.
   */
  static async create(page: Page, data: CreateLinkInput): Promise<Link | Video> {
    const { parentId, beforeId, at, url, preview = true, ...rest } = data;
    const metadata = preview ? await Link.getMetadata(page, url) : null;

    if (metadata?.type === "VIDEO") {
      // Link card dimensions do not suit a video, which uses its own sizing
      const { coordinates } = rest;
      return Video.createFromMetadata(page, metadata, { parentId, beforeId, at, coordinates });
    }

    const map = Link.createMap({
      ...rest,
      url,
      ...(metadata?.preview ?? EMPTY_PREVIEW),
    });
    const link = page.createTile(map, { parentId, beforeId, at }) as Link;
    link.editor.addTile(link);
    return link;
  }

  private static async getMetadata(page: Page, url: string): Promise<LinkMetadata> {
    const metadata = await client.externalLinks.getMetadata.query({ pageId: page.id, url });
    if (metadata.type === "LINK" && !metadata.preview) {
      throw new LinkPreviewError(url);
    }
    return metadata;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.url = this.binding.field("url", "");
    this.title = this.binding.field("title", null);
    this.description = this.binding.field("description", null);
    this.siteName = this.binding.field("siteName", null);
    this.imageId = this.binding.field("imageId", null);
  }

  /**
   * Changes the URL and replaces the preview with the new page's. Rejects with a
   * `LinkPreviewError`, leaving the link unchanged, when the page cannot be fetched, unless
   * `preview` is false.
   */
  async setUrl(url: string, { preview = true }: LinkPreviewOptions = {}) {
    const metadata = preview ? await Link.getMetadata(this.page, url) : null;
    if (metadata?.type === "VIDEO") {
      this.url.value = url;
      return;
    }

    const { title, description, siteName, imageId } = metadata?.preview ?? EMPTY_PREVIEW;
    this.url.value = url;
    this.title.value = title;
    this.description.value = description;
    this.siteName.value = siteName;
    this.imageId.value = imageId;
    this.background.value = imageId ? { type: "image", imageId } : null;
  }
}

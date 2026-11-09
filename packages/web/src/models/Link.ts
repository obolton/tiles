import * as Y from "yjs";
import type { PlacementInput } from "doc/tiles/base";
import Tile, { type CreateTileInput } from "./Tile";
import { buildLinkMap, type LinkMapInput } from "doc/tiles/link";
import { combine, type Reactive } from "reactivity";
import client, { type AppRouterOutputs } from "@/api/client";
import { showToast } from "@/utils/toasts";
import Video from "./Video";
import type Page from "@/models/Page";

type LinkMetadata = AppRouterOutputs["externalLinks"]["getMetadata"];

// Link cards default to a small square, as AUTO sizing would give them no height
const DEFAULT_SIZE = 5;

export interface CreateLinkInput extends Omit<CreateTileInput, "type"> {
  url: string;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

async function fetchMetadata(page: Page, url: string): Promise<LinkMetadata> {
  const metadata = await client.externalLinks.getMetadata.query({ pageId: page.id, url });
  if (metadata.type === "LINK" && !metadata.previewAvailable) {
    showToast("Couldn't load a preview for this link.", "error");
  }
  return metadata;
}

export default class Link extends Tile {
  readonly type = "LINK";

  readonly url: Reactive<string>;
  readonly title: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly siteName: Reactive<string | null>;
  readonly imageId: Reactive<string | null>;
  /** The title, or the link's hostname when no title could be fetched. */
  readonly displayTitle: Reactive<string>;

  static createMap(properties: Omit<LinkMapInput, keyof PlacementInput>): Y.Map<unknown> {
    return buildLinkMap(properties);
  }

  static async create(page: Page, data: CreateLinkInput): Promise<Link | Video> {
    const {
      parentId,
      beforeId,
      at,
      url,
      width = DEFAULT_SIZE,
      height = DEFAULT_SIZE,
      ...rest
    } = data;
    const metadata = await fetchMetadata(page, url);

    if (metadata.type === "VIDEO") {
      // Link card dimensions do not suit a video, which uses its own sizing
      const { coordinates } = rest;
      return Video.createFromMetadata(page, metadata, { parentId, beforeId, at, coordinates });
    }

    const map = Link.createMap({
      ...rest,
      width,
      height,
      url: metadata.url,
      title: metadata.title,
      description: metadata.description,
      siteName: metadata.siteName,
      imageId: metadata.imageId,
    });
    const link = page.createTile(map, { parentId, beforeId, at }) as Link;
    link.editor.addTile(link);
    return link;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.url = this.binding.field("url", "");
    this.title = this.binding.field("title", null);
    this.description = this.binding.field("description", null);
    this.siteName = this.binding.field("siteName", null);
    this.imageId = this.binding.field("imageId", null);
    this.displayTitle = combine(
      { title: this.title, url: this.url },
      ({ title, url }) => title || getHostname(url),
    );
  }

  async setUrl(url: string) {
    this.url.value = url;

    const metadata = await fetchMetadata(this.page, url);

    if (metadata.type === "LINK") {
      this.title.value = metadata.title;
      this.description.value = metadata.description;
      this.siteName.value = metadata.siteName;
      this.imageId.value = metadata.imageId;
      this.background.value = metadata.imageId
        ? { type: "image", imageId: metadata.imageId }
        : null;
    }
  }
}

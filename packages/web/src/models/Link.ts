import * as Y from "yjs";
import Tile, { type CreateTileInput } from "./Tile";
import { buildLinkMap, type LinkMapInput } from "doc/tiles/link";
import { type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import Video from "./Video";
import type Page from "@/models/Page";

export interface CreateLinkInput extends Omit<CreateTileInput, "type"> {
  url: string;
}

export default class Link extends Tile {
  readonly type = "LINK";

  readonly url: Reactive<string>;
  readonly title: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly siteName: Reactive<string | null>;
  readonly imageId: Reactive<string | null>;

  static createMap(properties: Omit<LinkMapInput, "parentId" | "beforeId">): Y.Map<unknown> {
    return buildLinkMap(properties);
  }

  static async create(page: Page, data: CreateLinkInput): Promise<Link | Video> {
    const { parentId, beforeId, url, ...rest } = data;
    const metadata = await client.externalLinks.getMetadata.query({
      pageId: page.id,
      url,
    });

    if (metadata.type === "VIDEO") {
      const map = Video.createMap({
        ...rest,
        videoType: metadata.videoType,
        videoId: metadata.videoId,
        title: metadata.title,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
      });
      const video = page.createTile(map, { parentId, beforeId }) as Video;
      video.editor.addTile(video);
      return video;
    }

    const map = Link.createMap({
      ...rest,
      url: metadata.url,
      title: metadata.title,
      description: metadata.description,
      siteName: metadata.siteName,
      imageId: metadata.imageId,
    });
    const link = page.createTile(map, { parentId, beforeId }) as Link;
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
  }

  async setUrl(url: string) {
    this.url.value = url;

    const metadata = await client.externalLinks.getMetadata.query({
      pageId: this.page.id,
      url,
    });

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

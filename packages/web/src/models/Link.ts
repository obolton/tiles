import * as Y from "yjs";
import Tile, { type CreateTileInput } from "./Tile";
import { type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import Video from "./Video";
import type Page from "@/models/Page";
import type { ClientLinkTile } from "api/types/tiles";

export interface CreateLinkInput extends Omit<CreateTileInput, "type"> {
  url: string;
}

interface CreateLinkMapInput extends Omit<
  CreateLinkInput,
  "parentId" | "beforeId"
> {
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageId: string | null;
}

export default class Link extends Tile {
  readonly type = "LINK";

  readonly url: Reactive<string>;
  readonly title: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly siteName: Reactive<string | null>;
  readonly imageId: Reactive<string | null>;

  static createMap(properties: CreateLinkMapInput): Y.Map<unknown> {
    const {
      url,
      title,
      description,
      siteName,
      imageId,
      background,
      ...baseProps
    } = properties;
    const map = super.buildBaseMap({
      ...baseProps,
      type: "LINK",
      background: imageId ? { type: "image", imageId } : background,
    });
    map.set("url", url);
    map.set("title", title);
    map.set("description", description);
    map.set("siteName", siteName);
    map.set("imageId", imageId);
    return map;
  }

  static async create(
    page: Page,
    data: CreateLinkInput,
  ): Promise<Link | Video> {
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

  serialize(): ClientLinkTile {
    return {
      ...super.serialize(),
      type: "LINK",
      url: this.url.value,
      title: this.title.value,
      description: this.description.value,
      siteName: this.siteName.value,
      imageId: this.imageId.value,
    };
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

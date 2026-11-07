import * as Y from "yjs";
import Tile, { type CreateTileInput } from "./Tile";
import { buildVideoMap, type VideoMapInput } from "doc/tiles/video";
import client, { type AppRouterOutputs } from "@/api/client";
import { type Reactive } from "reactivity";
import type Page from "@/models/Page";
import type { VideoType } from "doc/types/enums";

export type { VideoType };

export type VideoMetadata = NonNullable<AppRouterOutputs["videos"]["getMetadata"]>;

export interface CreateVideoInput extends Omit<CreateTileInput, "type"> {
  url: string;
}

/** Thrown when a URL is not a video from a supported provider. */
export class UnsupportedVideoError extends Error {
  constructor(url: string) {
    super(`Unsupported video URL: ${url}`);
    this.name = "UnsupportedVideoError";
  }
}

export default class Video extends Tile {
  readonly type = "VIDEO";

  readonly videoType: Reactive<VideoType>;
  readonly videoId: Reactive<string>;
  readonly imageUrl: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly title: Reactive<string>;

  static createMap(properties: Omit<VideoMapInput, "parentId" | "beforeId">): Y.Map<unknown> {
    return buildVideoMap(properties);
  }

  /** Creates a video from a supported video URL, such as a YouTube or Vimeo link. */
  static async create(page: Page, data: CreateVideoInput): Promise<Video> {
    const { url, ...rest } = data;
    const metadata = await client.videos.getMetadata.query({
      pageId: page.id,
      url,
    });

    if (!metadata) {
      throw new UnsupportedVideoError(url);
    }

    return Video.createFromMetadata(page, metadata, rest);
  }

  static createFromMetadata(
    page: Page,
    metadata: VideoMetadata,
    data: Omit<CreateTileInput, "type"> = {},
  ): Video {
    const { parentId, beforeId, ...rest } = data;
    const { videoType, videoId, title, description, imageUrl } = metadata;
    const map = Video.createMap({ ...rest, videoType, videoId, title, description, imageUrl });
    const video = page.createTile(map, { parentId, beforeId }) as Video;
    video.editor.addTile(video);
    return video;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.videoType = this.binding.field("videoType", "YOUTUBE");
    this.videoId = this.binding.field("videoId", "");
    this.imageUrl = this.binding.field("imageUrl", null);
    this.description = this.binding.field("description", null);
    this.title = this.binding.field("title", "");
  }
}

import * as Y from "yjs";
import Tile, { type CreateTileInput } from "./Tile";
import { type Reactive } from "@/utils/reactivity";
import type Page from "@/models/Page";
import type { ClientVideoTile } from "api/types/tiles";

export type VideoType = ClientVideoTile["videoType"];

export interface CreateVideoInput extends Omit<CreateTileInput, "type"> {
  videoType: VideoType;
  videoId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

export default class Video extends Tile {
  readonly type = "VIDEO";

  readonly videoType: Reactive<VideoType>;
  readonly videoId: Reactive<string>;
  readonly imageUrl: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly title: Reactive<string>;

  static createMap(
    properties: Omit<CreateVideoInput, "parentId" | "beforeId">,
  ): Y.Map<unknown> {
    const { videoType, videoId, title, description, imageUrl, ...baseProps } =
      properties;
    const map = super.buildBaseMap({ ...baseProps, type: "VIDEO" });
    map.set("videoType", videoType);
    map.set("videoId", videoId);
    map.set("title", title);
    map.set("description", description);
    map.set("imageUrl", imageUrl);
    return map;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.videoType = this.binding.field("videoType", "YOUTUBE");
    this.videoId = this.binding.field("videoId", "");
    this.imageUrl = this.binding.field("imageUrl", null);
    this.description = this.binding.field("description", null);
    this.title = this.binding.field("title", "");
  }

  serialize(): ClientVideoTile {
    return {
      ...super.serialize(),
      type: "VIDEO",
      videoType: this.videoType.value,
      videoId: this.videoId.value,
      imageUrl: this.imageUrl.value,
      description: this.description.value,
      title: this.title.value,
    };
  }
}

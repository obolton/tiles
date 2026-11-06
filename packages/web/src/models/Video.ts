import * as Y from "yjs";
import type { PlacementInput } from "doc/tiles/base";
import Tile from "./Tile";
import { buildVideoMap, type VideoMapInput } from "doc/tiles/video";
import { type Reactive } from "reactivity";
import type Page from "@/models/Page";
import type { VideoType } from "doc/types/enums";

export type { VideoType };
export type CreateVideoInput = VideoMapInput;

export default class Video extends Tile {
  readonly type = "VIDEO";

  readonly videoType: Reactive<VideoType>;
  readonly videoId: Reactive<string>;
  readonly imageUrl: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly title: Reactive<string>;

  static createMap(properties: Omit<CreateVideoInput, keyof PlacementInput>): Y.Map<unknown> {
    return buildVideoMap(properties);
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

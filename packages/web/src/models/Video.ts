import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type Page from "@/models/Page";
import type { ClientVideoTile } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export type VideoType = ClientVideoTile["videoType"];

export default class Video extends Tile {
  readonly type = "VIDEO";

  readonly videoType: VideoType;
  readonly videoId: string;
  readonly imageUrl: string | null;
  readonly title: Reactive<string>;

  constructor(page: Page, properties: ClientVideoTile) {
    super(page, properties);

    const { videoType, videoId, imageUrl, title } = properties;
    this.videoType = videoType;
    this.videoId = videoId;
    this.imageUrl = imageUrl;
    this.title = reactive(title);
  }

  private update(
    properties: Omit<AppRouterInputs["videos"]["update"], "pageId" | "id">,
  ) {
    return client.videos.update.mutate({
      ...properties,
      pageId: this.page.id,
      id: this.id,
    });
  }

  setTitle(title: string) {
    const previousTitle = this.title.value;
    this.title.value = title;

    this.editor.recordOperation({
      apply: {
        type: "video.setProperties",
        data: { tileId: this.id, changes: { title } },
      },
      reverse: {
        type: "video.setProperties",
        data: { tileId: this.id, changes: { title: previousTitle } },
      },
    });

    return this.update({ title });
  }
}

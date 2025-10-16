import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientVideoTile } from "api/src/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export type VideoType = ClientVideoTile["videoType"];

export default class Video extends Tile {
  readonly type = "VIDEO";

  readonly videoType: VideoType;
  readonly videoId: string;
  readonly imageUrl: string | null;
  readonly title: Reactive<string>;

  constructor(editor: Editor, properties: ClientVideoTile) {
    super(editor, properties);

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
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  setTitle(title: string) {
    this.title.value = title;
    return this.update({ title });
  }
}

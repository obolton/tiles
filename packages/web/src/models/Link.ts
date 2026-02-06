import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import Video from "./Video";
import type Editor from "@/editor/Editor";
import type { ClientLinkTile } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export interface LinkMetadata {
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
}

export default class Link extends Tile {
  readonly type = "LINK";

  readonly url: Reactive<string>;
  readonly title: Reactive<string | null>;
  readonly description: Reactive<string | null>;
  readonly siteName: Reactive<string | null>;
  readonly imageUrl: Reactive<string | null>;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["externalLinks"]["create"], "pageId">,
  ) {
    const properties = await client.externalLinks.create.mutate({
      pageId: editor.pageId,
      ...data,
    });

    switch (properties.type) {
      case "LINK": {
        const link = new Link(editor, properties);
        editor.addTile(link, properties.sectionId, data.beforeId);
        break;
      }
      case "VIDEO": {
        const video = new Video(editor, properties);
        editor.addTile(video, properties.sectionId, data.beforeId);
        break;
      }
    }

    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(editor: Editor, properties: ClientLinkTile) {
    super(editor, properties);

    const { url, title, description, siteName, imageUrl } = properties;
    this.url = reactive(url);
    this.title = reactive(title);
    this.description = reactive(description);
    this.siteName = reactive(siteName);
    this.imageUrl = reactive(imageUrl);
    this.background.value = imageUrl ? { type: "image", imageUrl } : null;
  }

  private async update(
    properties: Omit<
      AppRouterInputs["externalLinks"]["update"],
      "pageId" | "id"
    >,
  ) {
    return client.externalLinks.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  async setUrl(url: string) {
    // Capture previous state before changes
    const previousState = {
      url: this.url.value,
      title: this.title.value,
      description: this.description.value,
      siteName: this.siteName.value,
      imageUrl: this.imageUrl.value,
    };

    this.url.value = url;
    const { title, description, siteName, imageUrl } = await this.update({
      url,
    });
    this.title.value = title;
    this.description.value = description;
    this.siteName.value = siteName;
    this.imageUrl.value = imageUrl;
    this.background.value = imageUrl ? { type: "image", imageUrl } : null;

    // Record operation after API response with full state change
    this.editor.recordOperation({
      apply: {
        type: "link.setProperties",
        data: { tileId: this.id, changes: { url, title, description, siteName, imageUrl } },
      },
      reverse: {
        type: "link.setProperties",
        data: { tileId: this.id, changes: previousState },
      },
    });
  }
}

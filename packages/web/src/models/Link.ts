import Tile from "./Tile";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
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
    editor.addTile(properties);
  }

  constructor(editor: Editor, properties: ClientLinkTile) {
    super(editor, properties);

    const { url, title, description, siteName, imageUrl } = properties;
    this.url = reactive(url);
    this.title = reactive(title);
    this.description = reactive(description);
    this.siteName = reactive(siteName);
    this.imageUrl = reactive(imageUrl);
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
    this.url.value = url;
    const { title, description, siteName, imageUrl } = await this.update({
      url,
    });
    this.title.value = title;
    this.description.value = description;
    this.siteName.value = siteName;
    this.imageUrl.value = imageUrl;
  }
}

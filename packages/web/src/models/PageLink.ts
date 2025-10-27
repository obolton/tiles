import Tile from "./Tile";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientPageLinkTile } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export default class PageLink extends Tile {
  readonly type = "PAGE_LINK";

  readonly page: ClientPageLinkTile["linkedPage"];

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["pageLinks"]["create"], "pageId">,
  ) {
    const properties = await client.pageLinks.create.mutate({
      pageId: editor.pageId,
      ...data,
    });
    editor.addTile(properties);
  }

  constructor(editor: Editor, properties: ClientPageLinkTile) {
    super(editor, properties);

    const { linkedPage } = properties;
    this.page = linkedPage;
  }
}

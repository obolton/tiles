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
    const pageLink = new PageLink(editor, properties);
    editor.addTile(pageLink, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(editor: Editor, properties: ClientPageLinkTile) {
    super(editor, properties);

    const { linkedPage } = properties;
    this.page = linkedPage;
  }
}

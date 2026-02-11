import Tile from "./Tile";
import client from "@/api/client";
import type Page from "@/models/Page";
import type { ClientPageLinkTile } from "api/types/tiles";
import type { AppRouterInputs } from "@/api/client";

export default class PageLink extends Tile {
  readonly type = "PAGE_LINK";

  readonly linkedPage: ClientPageLinkTile["linkedPage"];

  static async create(
    page: Page,
    data: Omit<AppRouterInputs["pageLinks"]["create"], "pageId">,
  ) {
    const properties = await client.pageLinks.create.mutate({
      pageId: page.id,
      ...data,
    });
    const pageLink = new PageLink(page, properties);
    const { editor } = pageLink;
    editor.addTile(pageLink, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(page: Page, properties: ClientPageLinkTile) {
    super(page, properties);

    this.linkedPage = properties.linkedPage;
  }
}

import Tile from "./Tile";
import type Editor from "@/editor/Editor";
import type { ClientPageLinkTile } from "@/types/tiles";

export default class PageLink extends Tile {
  readonly type = "PAGE_LINK";

  readonly page: ClientPageLinkTile["linkedPage"];

  constructor(editor: Editor, properties: ClientPageLinkTile) {
    super(editor, properties);

    const { linkedPage } = properties;
    this.page = linkedPage;
  }
}

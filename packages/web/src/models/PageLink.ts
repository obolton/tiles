import * as Y from "yjs";
import type { PlacementInput } from "doc/tiles/base";
import Tile, { type CreateTileInput } from "./Tile";
import { buildPageLinkMap, type LinkedPage } from "doc/tiles/pageLink";
import { type Reactive } from "reactivity";
import type Page from "@/models/Page";

export interface CreatePageLinkInput extends Omit<CreateTileInput, "type"> {
  linkedPage: LinkedPage;
}

// TODO: this currently snapshots the linked page's metadata into the Y.Map at
// link-time, so renamed pages won't update referencing links. Replace with a
// shared PageMetadataStore (lazy tRPC fetch + SSR pre-seed) that resolves
// `linkedPageId` reactively against live page data.
export default class PageLink extends Tile {
  readonly type = "PAGE_LINK";

  readonly linkedPage: Reactive<LinkedPage | null>;

  static createMap(properties: Omit<CreatePageLinkInput, keyof PlacementInput>): Y.Map<unknown> {
    return buildPageLinkMap(properties);
  }

  static async create(page: Page, data: CreatePageLinkInput): Promise<PageLink> {
    const { parentId, beforeId, at, ...rest } = data;
    const map = PageLink.createMap(rest);
    const pageLink = page.createTile(map, { parentId, beforeId, at }) as PageLink;
    pageLink.editor.addTile(pageLink);
    return pageLink;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.linkedPage = this.binding.field("linkedPage", null);
  }
}

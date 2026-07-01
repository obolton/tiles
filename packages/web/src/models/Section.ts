import * as Y from "yjs";
import Tile from "./Tile";
import { buildSectionMap, type SectionMapInput } from "doc/tiles/section";
import type TileCollection from "./TileCollection";
import type { Reactive } from "@/utils/reactivity";
import type { Layout, MapStyle } from "doc/types/tiles/section";
import type Page from "@/models/Page";

export type CreateSectionInput = SectionMapInput;

export default class Section extends Tile {
  readonly type = "SECTION";

  readonly layout: Reactive<Layout>;
  readonly mapStyle: Reactive<MapStyle | null>;
  readonly columns: Reactive<number | null>;

  /** This section's children, as a controller-maintained order-sorted view. */
  get tiles(): TileCollection {
    return this.page.placement.getCollection(this.id);
  }

  static createMap(properties: Omit<CreateSectionInput, "parentId" | "beforeId">): Y.Map<unknown> {
    return buildSectionMap(properties);
  }

  static async create(page: Page, data: CreateSectionInput): Promise<Section> {
    const { parentId, beforeId, ...rest } = data;
    const map = Section.createMap(rest);
    const section = page.createTile(map, { parentId, beforeId }) as Section;
    section.editor.addTile(section);
    return section;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.layout = this.binding.field<Layout>("layout", "VERTICAL");
    this.mapStyle = this.binding.field<MapStyle | null>("mapStyle", null);
    this.columns = this.binding.field<number | null>("columns", null);
  }
}

import Tile from "./Tile";
import type TileCollection from "./TileCollection";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { ClientSectionTile, Layout, MapStyle } from "api/types/tiles";
import type Page from "@/models/Page";
import type { AppRouterInputs } from "@/api/client";

export default class Section extends Tile {
  readonly type = "SECTION";

  readonly layout: Reactive<Layout>;
  readonly mapStyle: Reactive<MapStyle | null>;
  readonly columns: Reactive<number | null>;

  /** This section's children, as a controller-maintained order-sorted view. */
  get tiles(): TileCollection {
    return this.page.placement.getCollection(this.id);
  }

  static async create(
    page: Page,
    data: Omit<AppRouterInputs["sections"]["create"], "pageId">,
  ) {
    const properties = await client.sections.create.mutate({
      pageId: page.id,
      ...data,
    });
    const section = new Section(page, properties);
    const { editor } = section;
    editor.addTile(section);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
    return section;
  }

  constructor(page: Page, properties: ClientSectionTile) {
    super(page, properties);

    const { layout, mapStyle, columns } = properties;
    this.layout = reactive(layout);
    this.mapStyle = reactive(mapStyle);
    this.columns = reactive(columns);
  }

  serialize(): ClientSectionTile {
    return {
      ...super.serialize(),
      type: "SECTION",
      layout: this.layout.value,
      columns: this.columns.value,
      mapStyle: this.mapStyle.value,
    };
  }

  private update(
    properties: Omit<AppRouterInputs["sections"]["update"], "pageId" | "id">,
  ) {
    return client.sections.update.mutate({
      ...properties,
      pageId: this.page.id,
      id: this.id,
    });
  }

  setLayout(layout: Layout) {
    const oldLayout = this.layout.value;
    this.layout.value = layout;
    this.editor.recordOperation({
      apply: {
        type: "section.setLayout",
        data: { tileId: this.id, layout },
      },
      reverse: {
        type: "section.setLayout",
        data: { tileId: this.id, layout: oldLayout },
      },
    });
    return this.update({ layout });
  }

  setMapStyle(mapStyle: MapStyle) {
    const oldMapStyle = this.mapStyle.value;
    this.mapStyle.value = mapStyle;
    this.editor.recordOperation({
      apply: {
        type: "section.setMapStyle",
        data: { sectionId: this.id, mapStyle },
      },
      reverse: {
        type: "section.setMapStyle",
        data: { sectionId: this.id, mapStyle: oldMapStyle },
      },
    });
    return this.update({ mapStyle });
  }

  setColumns(columns: number | null) {
    const oldColumns = this.columns.value;
    this.columns.value = columns;
    this.editor.recordOperation({
      apply: {
        type: "section.setColumns",
        data: { tileId: this.id, columns },
      },
      reverse: {
        type: "section.setColumns",
        data: { tileId: this.id, columns: oldColumns },
      },
    });
    return this.update({ columns });
  }
}

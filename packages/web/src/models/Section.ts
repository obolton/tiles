import Tile from "./Tile";
import type TileCollection from "./TileCollection";
import type { Reactive } from "@/utils/reactivity";
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
    this.layout = this.bind<Layout>("layout", layout);
    this.mapStyle = this.bind<MapStyle | null>("mapStyle", mapStyle);
    this.columns = this.bind<number | null>("columns", columns);
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
}

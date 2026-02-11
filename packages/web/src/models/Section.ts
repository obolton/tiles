import Tile from "./Tile";
import TileCollection from "./TileCollection";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { ClientSectionTile, Layout } from "api/types/tiles";
import type Page from "@/models/Page";
import type { AppRouterInputs } from "@/api/client";

export default class Section extends Tile {
  readonly type = "SECTION";

  readonly layout: Reactive<Layout>;
  readonly tiles: TileCollection;

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
    editor.addTile(section, null, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(page: Page, properties: ClientSectionTile) {
    super(page, properties);

    const { layout } = properties;
    this.layout = reactive(layout);
    this.tiles = new TileCollection(this.id);
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
        data: { sectionId: this.id, layout },
      },
      reverse: {
        type: "section.setLayout",
        data: { sectionId: this.id, layout: oldLayout },
      },
    });
    return this.update({ layout });
  }
}

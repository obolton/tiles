import Tile from "./Tile";
import TileCollection from "./TileCollection";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { ClientSectionTile, Layout } from "api/types/tiles";
import type Editor from "@/editor/Editor";
import type { AppRouterInputs } from "@/api/client";

export default class Section extends Tile {
  readonly type = "SECTION";

  readonly layout: Reactive<Layout>;
  readonly tiles: TileCollection;

  static async create(
    editor: Editor,
    data: Omit<AppRouterInputs["sections"]["create"], "pageId">,
  ) {
    const properties = await client.sections.create.mutate({
      pageId: editor.pageId,
      ...data,
    });
    const section = new Section(editor, properties);
    editor.addTile(section, null, data.beforeId);
  }

  constructor(editor: Editor, properties: ClientSectionTile) {
    super(editor, properties);

    const { layout } = properties;
    this.layout = reactive(layout);
    this.tiles = new TileCollection(this.id);
  }

  private update(
    properties: Omit<AppRouterInputs["sections"]["update"], "pageId" | "id">,
  ) {
    return client.sections.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  setLayout(layout: Layout) {
    this.layout.value = layout;
    return this.update({ layout });
  }
}

import Tile from "./Tile";
import TileCollection from "./TileCollection";
import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { ClientSectionTile, Layout } from "api/types/tiles";
import type Editor from "@/editor/Editor";
import type {
  Background,
  BackgroundUpdate,
} from "@/components/backgrounds/types";
import type { AppRouterInputs } from "@/api/client";

export default class Section extends Tile {
  readonly type = "SECTION";

  readonly background: Reactive<Background | null>;
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
    editor.addTile(section, data.afterId);
  }

  constructor(editor: Editor, properties: ClientSectionTile) {
    super(editor, properties);

    const { layout, background } = properties;
    this.layout = reactive(layout);
    this.background = reactive(background);
    this.block.value = false;
    this.tiles = new TileCollection(this);
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

  async setBackground(background: BackgroundUpdate) {
    const result = await this.update({ background });
    this.background.value = result.background;
  }
}

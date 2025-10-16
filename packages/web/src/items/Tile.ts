import { reactive, type Reactive } from "@/utils/reactivity";
import type { ClientTile } from "api/src/types/tiles";
import type Editor from "@/editor/Editor";

export default class Tile {
  readonly editor: Editor;
  readonly id: string;
  readonly placementId: string;
  readonly type: string;

  readonly sectionId: Reactive<string>;
  readonly position: Reactive<number>;
  readonly x: Reactive<number>;
  readonly y: Reactive<number>;
  readonly width: Reactive<number>;
  readonly height: Reactive<number>;
  readonly rowSpan: Reactive<number>;
  readonly block: Reactive<boolean>;

  constructor(editor: Editor, properties: ClientTile) {
    const {
      id,
      placementId,
      type,
      sectionId,
      position,
      x,
      y,
      width,
      height,
      rowSpan,
      block,
    } = properties;
    this.editor = editor;

    this.id = id;
    this.placementId = placementId;
    this.type = type;

    this.sectionId = reactive(sectionId);
    this.position = reactive(position);
    this.x = reactive(x);
    this.y = reactive(y);
    this.width = reactive(width);
    this.height = reactive(height);
    this.rowSpan = reactive(rowSpan);
    this.block = reactive(block);
  }

  delete() {
    return this.editor.deleteTiles([this.placementId]);
  }
}

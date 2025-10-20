import { reactive, type Reactive } from "@/utils/reactivity";
import client from "@/api/client";
import type { ClientTile, Animation } from "api/types/tiles";
import type Editor from "@/editor/Editor";
import type { AppRouterInputs } from "@/api/client";

export type { Animation };

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
  readonly animation: Reactive<Animation | null>;

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
      animation,
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
    this.animation = reactive(animation);
  }

  delete() {
    return this.editor.deleteTiles([this.placementId]);
  }

  private updatePlacement(
    properties: Omit<AppRouterInputs["tiles"]["update"], "pageId" | "id">,
  ) {
    return client.tiles.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.placementId,
    });
  }

  setAnimation(animation: Animation | null) {
    this.animation.value = animation;
    return this.updatePlacement({ animation });
  }
}

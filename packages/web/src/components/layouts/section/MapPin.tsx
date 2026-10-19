import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import ImageModel from "@/models/Image";
import { makeDraggable, type DragDropEvent } from "@/utils/drag";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import styles from "./MapSection.module.css";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";
import type { Reactive } from "reactivity";

export interface MapPinProps {
  tile: Tile;
  editor: Editor;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<string | null>;
  signal?: AbortSignal;
}

export default function MapPin({ tile, editor, tabindex, resize, signal }: MapPinProps) {
  const imageUrl = tile instanceof ImageModel ? tile.imageUrl : null;
  function onPointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON || !editor.isEditable.value) {
      return;
    }
    event.stopPropagation();
    editor.select([tile.id]);
  }

  function onDragStart(event: DragDropEvent) {
    event.state.data = { tile };
  }

  function handleRef(element: HTMLElement) {
    makeDraggable(element, { signal });
  }

  return (
    <map-point
      classList={{ [styles.pin]: true }}
      lat={tile.coordinates.derive((c) => c?.lat ?? null)}
      long={tile.coordinates.derive((c) => c?.long ?? null)}
      on:pointerdown={onPointerDown}
    >
      <div ref={handleRef} className={styles.handle} on:dnd-dragstart={onDragStart}>
        {imageUrl ? (
          <img className={styles.image} src={imageUrl} alt="" draggable="false" />
        ) : (
          <span className={styles.dot} />
        )}
      </div>
      <Item tile={tile} tabindex={tabindex} resize={resize}>
        <TileContent tile={tile} />
      </Item>
    </map-point>
  );
}

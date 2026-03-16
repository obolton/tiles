import Item from "@/components/item/Item";
import ImageModel from "@/models/Image";
import { getTileLabel } from "@/utils/tileLabel";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import styles from "./MapSection.module.css";
import type Tile from "@/models/Tile";
import type Editor from "@/editor/Editor";
import type { ResizeDirection } from "@/elements/item/PageItem";
import type { Reactive } from "@/utils/reactivity";

export interface MapPinProps {
  tile: Tile;
  editor: Editor;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<ResizeDirection | null>;
}

export default function MapPin({
  tile,
  editor,
  tabindex,
  resize,
}: MapPinProps) {
  const imageUrl = tile instanceof ImageModel ? tile.imageUrl : null;
  const label = getTileLabel(tile);

  function onPointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }
    event.stopPropagation();
    editor.select([tile.id]);
  }

  return (
    <map-point
      classList={{ [styles.pin]: true }}
      lat={tile.coordinates.derive((c) => c?.lat ?? null)}
      long={tile.coordinates.derive((c) => c?.long ?? null)}
      on:pointerdown={onPointerDown}
    >
      {imageUrl ? (
        <img className={styles.image} src={imageUrl} alt="" draggable="false" />
      ) : (
        <span className={styles.dot} />
      )}
      <span className={styles.label}>{label}</span>
      <Item
        editable={editor.isEditable}
        tile={tile}
        tabindex={tabindex}
        resize={resize}
      />
    </map-point>
  );
}

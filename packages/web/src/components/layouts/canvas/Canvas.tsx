import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Canvas.module.css";
import Each from "@/jsx/each";
import type { Tile } from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type ScrollView from "@/elements/scroll-view/ScrollView";

export interface CanvasProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  sectionId: string;
  items: Reactive<Tile[]>;
  signal?: AbortSignal;
}

export default function Canvas({
  editor,
  isEditable,
  sectionId,
  items,
  signal,
}: CanvasProps) {
  const ref = (scrollView: ScrollView) => {
    new LayoutEditor({
      element: scrollView,
      grid: scrollView.contents,
      dropTarget: scrollView.parentElement!,
      editor,
      sectionId,
      signal,
    });
  };

  return (
    <scroll-view ref={ref} className={styles.canvas}>
      <Each items={items}>
        {(tile) => (
          <Item
            editor={editor}
            id={tile.id}
            placementId={tile.placementId}
            editable={isEditable}
            x={tile.x}
            y={tile.y}
            width={tile.width}
            height={tile.height}
            rowSpan={tile.rowSpan}
            block={tile.type === "TEXT" ? tile.block : undefined}
            tile={tile}
            tabIndex={isEditable.derive((editable) =>
              editable ? 0 : undefined,
            )}
          />
        )}
      </Each>
    </scroll-view>
  );
}

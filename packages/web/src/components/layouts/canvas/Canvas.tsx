import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import DragPlaceholder from "@/components/drag/DragPlaceholder";
import styles from "./Canvas.module.css";
import type { Tile } from "@/types/tiles";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

export interface CanvasProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  sectionId: string;
  items: Reactive<Tile[]>;
  minColumnSpan?: number;
  minRowSpan?: number;
  signal?: AbortSignal;
}

export default function Canvas({
  editor,
  isEditable,
  sectionId,
  items,
  minColumnSpan = 1,
  minRowSpan = 1,
  signal,
}: CanvasProps) {
  const { dragTile } = editor;

  const ref = (element: HTMLElement) => {
    const layoutEditor = new LayoutEditor({
      element,
      editor,
      sectionId,
      ordered: false,
    });
    signal?.addEventListener("abort", () => layoutEditor.disconnect());
  };

  return (
    <scroll-view
      ref={ref}
      className={styles.canvas}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
    >
      {items.derive((entries) =>
        entries.map((tile) => (
          <Item
            editor={editor}
            id={tile.id}
            placementId={tile.placementId}
            editable={isEditable}
            x={tile.x}
            y={tile.y}
            rows={tile.height}
            minRows={minRowSpan}
            columns={tile.width}
            minColumns={minColumnSpan}
            tile={tile}
            tabIndex={isEditable.derive((editable) =>
              editable ? 0 : undefined,
            )}
          />
        )),
      )}

      {dragTile.derive((tile) =>
        tile?.sectionId.derive((value) =>
          value === sectionId ? (
            <DragPlaceholder
              x={tile.x}
              y={tile.y}
              width={tile.width}
              height={tile.height}
            />
          ) : null,
        ),
      )}
    </scroll-view>
  );
}

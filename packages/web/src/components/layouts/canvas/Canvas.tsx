import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./Canvas.module.css";
import type { Tile } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";

export interface CanvasProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  collectionId: string;
  items: Reactive<Tile[]>;
  columns?: number;
  minColumnSpan?: number;
  minRowSpan?: number;
  Placeholder?: JSX.Component<Pick<CanvasProps, "collectionId">>;
}

export default function Canvas({
  editor,
  isEditable,
  collectionId,
  items,
  columns = 3,
  minColumnSpan = 1,
  minRowSpan = 1,
  Placeholder,
}: CanvasProps) {
  const { dragId } = editor;

  const style = {
    "--columns": columns.toString(),
  };

  const ref = (element: HTMLElement) => {
    // TODO: Remove editor at end
    new LayoutEditor({
      element,
      editor,
      collectionId,
    });
  };

  return (
    <section
      ref={ref}
      className={styles.grid}
      style={style}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
    >
      {items.derive((entries) =>
        entries.length === 0 ? (
          Placeholder ? (
            <Placeholder collectionId={collectionId} />
          ) : null
        ) : (
          entries.map((tile) => (
            <Item
              editor={editor}
              classList={{
                [styles["drag-placeholder"]]: dragId.derive(
                  (id) => id === tile.placementId,
                ),
              }}
              id={tile.id}
              placementId={tile.placementId}
              x={tile.x}
              y={tile.y}
              rows={tile.height}
              minRows={minRowSpan}
              columns={tile.width}
              minColumns={minColumnSpan}
              maxColumns={columns}
              deletable={isEditable}
              draggable={isEditable}
              resizable={isEditable}
              grow={columns === 1}
              tile={tile}
              tabIndex={isEditable.derive((editable) =>
                editable ? 0 : undefined,
              )}
            />
          ))
        ),
      )}
    </section>
  );
}

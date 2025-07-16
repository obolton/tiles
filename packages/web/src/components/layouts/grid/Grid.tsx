import Item from "@/components/item/Item";
import styles from "./Grid.module.css";
import type { Tile } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import LayoutEditor from "@/editor/LayoutEditor";

export interface GridProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  sectionId: string;
  items: Reactive<Tile[]>;
  columns?: number;
  minColumnSpan?: number;
  minRowSpan?: number;
  Placeholder?: JSX.Component<Pick<GridProps, "sectionId">>;
}

export default function Grid({
  editor,
  isEditable,
  sectionId,
  items,
  columns = 3,
  minColumnSpan = 1,
  minRowSpan = 1,
  Placeholder,
}: GridProps) {
  const { dragId } = editor;

  const style = {
    "--columns": columns.toString(),
  };

  const ref = (element: HTMLElement) => {
    // TODO: Remove editor at end
    new LayoutEditor({
      element,
      editor,
      sectionId,
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
            <Placeholder sectionId={sectionId} />
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

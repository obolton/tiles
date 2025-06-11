import GridItem from "@/components/grid/GridItem";
import styles from "./Grid.module.css";
import type { Tile } from "@/types/tiles";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import LayoutEditor from "@/editor/LayoutEditor";

export interface GridProps {
  editor: Editor;
  isEditable: Reactive<boolean>;
  collectionId: string;
  items: Reactive<Tile[]>;
  columns?: number;
  minColumnSpan?: number;
  minRowSpan?: number;
  Placeholder?: JSX.Component<Pick<GridProps, "collectionId">>;
}

export default function Grid({
  editor,
  isEditable,
  collectionId,
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
            <GridItem
              editor={editor}
              classList={{
                [styles["drag-placeholder"]]: dragId.derive(
                  (id) => id === tile.placementId,
                ),
              }}
              id={tile.id}
              placementId={tile.placementId}
              rows={tile.rows}
              minRows={minRowSpan}
              columns={tile.columns}
              minColumns={minColumnSpan}
              maxColumns={columns}
              deletable={isEditable}
              draggable={isEditable}
              resizable={isEditable}
              grow={tile.type === "TEXT" ? tile.expand : undefined}
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

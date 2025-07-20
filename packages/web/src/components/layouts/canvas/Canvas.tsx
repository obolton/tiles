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
  sectionId: string;
  items: Reactive<Tile[]>;
  minColumnSpan?: number;
  minRowSpan?: number;
  Placeholder?: JSX.Component<Pick<CanvasProps, "sectionId">>;
  signal?: AbortSignal;
}

export default function Canvas({
  editor,
  isEditable,
  sectionId,
  items,
  minColumnSpan = 1,
  minRowSpan = 1,
  Placeholder,
  signal,
}: CanvasProps) {
  const { dragId } = editor;

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
    <section
      ref={ref}
      className={styles.canvas}
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
              x={tile.x}
              y={tile.y}
              rows={tile.height}
              minRows={minRowSpan}
              columns={tile.width}
              minColumns={minColumnSpan}
              deletable={isEditable}
              draggable={isEditable}
              resizable={isEditable}
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

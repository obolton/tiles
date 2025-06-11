import GridItem from "@/components/grid/GridItem";
import styles from "./Carousel.module.css";
import { reactive, flag } from "@/utils/reactivity";
import LayoutEditor from "@/editor/LayoutEditor";
import type { Tile } from "@/types/tiles";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export interface CarouselProps {
  editor: Editor;
  collectionId: string;
  items: Reactive<Tile[]>;
  Placeholder?: JSX.Component<Pick<CarouselProps, "collectionId">>;
  signal?: AbortSignal;
}

export default function Carousel({
  editor,
  collectionId,
  items,
  Placeholder,
  signal,
}: CarouselProps) {
  const { isEditable, dragId } = editor;

  const ref = (element: HTMLElement) => {
    const layoutEditor = new LayoutEditor({
      element,
      editor,
      collectionId,
    });
    signal?.addEventListener("abort", () => layoutEditor.disconnect());
  };

  return (
    <carousel-view
      ref={ref}
      classList={{ [styles.carousel]: true, [styles.editable]: isEditable }}
      data-drop={isEditable.derive((editable) =>
        editable ? "true" : undefined,
      )}
    >
      {items.derive((value) =>
        value.length === 0 ? (
          Placeholder ? (
            <Placeholder collectionId={collectionId} />
          ) : null
        ) : (
          value.map((item) => (
            <GridItem
              editor={editor}
              classList={{
                [styles.item]: true,
                [styles.dragging]: dragId.derive(
                  (id) => id === item.placementId,
                ),
              }}
              id={item.id}
              collectionId={collectionId}
              placementId={item.placementId}
              rows={reactive(1)}
              columns={item.columns}
              deletable={isEditable}
              draggable={isEditable}
              resizable={isEditable}
              grow={flag(false)}
              tile={item}
              tabIndex={isEditable.derive((editable) =>
                editable ? 0 : undefined,
              )}
            />
          ))
        ),
      )}
    </carousel-view>
  );
}

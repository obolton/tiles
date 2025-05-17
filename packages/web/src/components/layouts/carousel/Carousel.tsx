import GridItem from "@/components/grid/GridItem";
import styles from "./Carousel.module.css";
import type { Tile } from "@/types/layout";
import { ReactiveValue } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";
import LayoutEditor from "@/editor/LayoutEditor";

interface CarouselProps {
  editor: Editor;
  collectionId: string;
  items: ReactiveValue<Tile[]>;
  Placeholder?: JSX.Component<Pick<CarouselProps, "collectionId">>;
}

export default function Carousel({
  editor,
  collectionId,
  items,
  Placeholder,
}: CarouselProps) {
  const { isEditable, dragId } = editor;

  const ref = (element: HTMLElement) => {
    // TODO: Remove editor at end
    new LayoutEditor({
      element,
      editor,
      collectionId,
    });
  };

  return (
    <carousel-view
      ref={ref}
      classList={{ [styles.carousel]: true, [styles.editable]: isEditable }}
      tabIndex={0}
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
              rows={new ReactiveValue(1)}
              columns={item.columns}
              deletable={isEditable}
              draggable={isEditable}
              resizable={isEditable}
              grow={false}
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

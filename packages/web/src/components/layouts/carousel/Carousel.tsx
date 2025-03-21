import { useRef } from "react";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { classNames } from "@/utils/css";
import styles from "./Carousel.module.css";
import type CarouselView from "@/elements/carousel/CarouselView";
import type { Tile } from "@/types/layout";
import { useDragId } from "@/context/drag";

interface CarouselProps {
  collectionId: string;
  items: Tile[];
  Placeholder?: React.ComponentType<Pick<CarouselProps, "collectionId">>;
}

export default function Carousel({
  collectionId,
  items,
  Placeholder,
}: CarouselProps) {
  const ref = useRef<CarouselView>(null);
  const isEditable = useEditable();
  useLayoutEditor(ref, collectionId);
  const dragId = useDragId();

  return (
    <carousel-view
      ref={ref}
      class={classNames(styles.carousel, isEditable && styles.editable)}
      tabIndex={0}
      data-drop={isEditable ? "true" : undefined}
    >
      {items.length === 0 && Placeholder ? (
        <Placeholder collectionId={collectionId} />
      ) : null}

      {items.map((item) => (
        <GridItem
          className={classNames(
            styles.item,
            dragId === item.placementId && styles.dragging,
          )}
          key={item.id}
          id={item.id}
          collectionId={collectionId}
          placementId={item.placementId}
          rows={1}
          columns={item.columns}
          deletable={isEditable}
          draggable={isEditable}
          resizable={isEditable}
          grow={false}
          tile={item}
          tabIndex={isEditable ? 0 : undefined}
        />
      ))}
    </carousel-view>
  );
}

import { useRef } from "react";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { classNames } from "@/utils/css";
import styles from "./Carousel.module.css";
import type CarouselView from "@/elements/carousel/CarouselView";
import type { ClientTile } from "@/types/tiles";
import { useDragId } from "@/context/drag";

interface CarouselProps {
  id?: string;
  items: ClientTile[];
}

export default function Carousel({ id, items }: CarouselProps) {
  const ref = useRef<CarouselView>(null);
  const isEditable = useEditable();
  useLayoutEditor(ref, id);
  const dragId = useDragId();

  return (
    <carousel-view
      ref={ref}
      class={classNames(styles.carousel, isEditable && styles.editable)}
      tabindex="0"
    >
      {items.map((item) => (
        <GridItem
          className={classNames(
            styles.item,
            dragId === item.placementId && styles.dragging,
          )}
          key={item.id}
          id={item.id}
          placementId={item.placementId}
          rows={1}
          columns={1}
          deletable={isEditable}
          draggable={isEditable}
          resizable={false}
          grow={false}
          tile={item}
        />
      ))}
    </carousel-view>
  );
}

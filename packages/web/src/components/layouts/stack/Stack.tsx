import { useRef, useState } from "react";
import styles from "./Stack.module.css";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { useDragId } from "@/context/drag";
import { classNames } from "@/utils/css";
import type StackView from "@/elements/stack/StackView";
import type { Tile } from "@/types/layout";

interface StackProps {
  collectionId: string;
  items: Tile[];
  Placeholder?: React.ComponentType<Pick<StackProps, "collectionId">>;
}

export default function Stack({
  collectionId,
  items,
  Placeholder,
}: StackProps) {
  const ref = useRef<StackView>(null);
  const [open, setOpen] = useState(false);
  const isEditable = useEditable();
  useLayoutEditor(ref, collectionId);
  const dragId = useDragId();

  const onToggle = ({ newState }: ToggleEvent) => setOpen(newState === "open");

  return (
    <stack-view
      ref={ref}
      class={styles.stack}
      expandable="expandable"
      ontoggle={onToggle}
      data-drop={isEditable ? "true" : undefined}
    >
      {items.length === 0 && Placeholder ? (
        <Placeholder collectionId={collectionId} />
      ) : null}

      {items.map((item, i) => (
        <GridItem
          className={classNames(
            styles.item,
            dragId === item.placementId ? styles.dragging : undefined,
          )}
          key={item.id}
          id={item.id}
          collectionId={collectionId}
          placementId={item.placementId}
          rows={1}
          columns={1}
          deletable={isEditable && open}
          draggable={isEditable && open}
          resizable={false}
          grow={false}
          style={
            {
              "--index": i,
              "--angle": i === 0 ? 0 : `${((i * 123) % 20) - 10}deg`,
            } as React.CSSProperties
          }
          tile={item}
          tabIndex={open ? 0 : undefined}
        />
      ))}
    </stack-view>
  );
}

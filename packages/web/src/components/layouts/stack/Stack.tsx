import { useRef, useState } from "react";
import styles from "./Stack.module.css";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { useDragId } from "@/context/drag";
import { classNames } from "@/utils/css";
import type StackView from "@/components/expandable/StackView";
import type { ClientTile } from "@/types/tiles";

interface StackProps {
  id?: string;
  items: ClientTile[];
}

export default function Stack({ id, items }: StackProps) {
  const ref = useRef<StackView>(null);
  const [open, setOpen] = useState(false);
  const isEditable = useEditable();
  useLayoutEditor(ref, id);
  const dragId = useDragId();

  const onToggle = ({ newState }: ToggleEvent) => setOpen(newState === "open");

  return (
    <stack-view
      ref={ref}
      class={styles.stack}
      expandable="expandable"
      ontoggle={onToggle}
    >
      {items.map((item, i) => (
        <GridItem
          className={classNames(
            styles.item,
            dragId === item.placementId ? styles.dragging : undefined,
          )}
          key={item.id}
          id={item.id}
          placementId={item.placementId}
          rows={1}
          columns={1}
          isEditable={isEditable && open}
          resizable={false}
          grow={false}
          style={
            {
              "--index": i,
              "--angle": i === 0 ? 0 : `${((i * 123) % 20) - 10}deg`,
            } as React.CSSProperties
          }
          tile={item}
        />
      ))}
    </stack-view>
  );
}

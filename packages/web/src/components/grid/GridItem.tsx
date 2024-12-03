import { useCallback, useEffect, useMemo, useRef } from "react";
import { classNames } from "@/utils/css";
import useCreateCollection from "@/hooks/useCreateCollection";
import useDraggable from "@/hooks/useDraggable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import DeleteButton from "../tiles/DeleteButton";
import styles from "./GridItem.module.css";
import type ResizeItem from "@/components/resize/ResizeItem";

interface GridItemProps {
  id: string;
  style?: React.CSSProperties;
  className?: string;
  rows: number;
  columns: number;
  grow?: boolean;
  isEditable?: boolean;
  resizable?: boolean;
  dropGroup?: string;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}

export default function GridItem({
  id,
  className,
  style,
  rows,
  columns,
  grow = false,
  isEditable = false,
  resizable = false,
  dropGroup,
  onDelete,
  children,
}: GridItemProps) {
  const ref = useRef<ResizeItem>(null);
  const onDrop = useCreateCollection(id ?? "", "STACK");
  useDraggable(ref, isEditable && !!dropGroup);
  useScrollIntoView(ref);

  const handleDelete = useCallback(() => onDelete(id), [id, onDelete]);

  const combinedStyles = useMemo(
    () =>
      ({
        ...style,
        "--columns": columns,
        "--rows": rows,
      }) as React.CSSProperties,
    [style, columns, rows],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !onDrop) {
      return;
    }
    element.addEventListener("drag:drop-on", onDrop);
    return () => element.removeEventListener("drag:drop-on", onDrop);
  }, [onDrop]);

  return (
    <resize-item
      id={id}
      ref={ref}
      disabled={!resizable ? "disabled" : undefined}
      class={classNames(
        styles.item,
        isEditable && styles.editable,
        grow && styles.grow,
        className,
      )}
      style={combinedStyles}
      data-rows={rows}
      data-columns={columns}
      data-drop-group={dropGroup}
    >
      {children}
      {isEditable ? (
        <DeleteButton className={styles.delete} onPress={handleDelete} />
      ) : null}
    </resize-item>
  );
}

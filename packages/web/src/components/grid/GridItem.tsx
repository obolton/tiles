import { useCallback, useMemo, useRef } from "react";
import { classNames } from "@/utils/css";
import useCreateCollection from "@/hooks/useCreateCollection";
import useDraggable from "@/hooks/useDraggable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import DeleteButton from "../tiles/DeleteButton";
import styles from "./GridItem.module.css";
import type ResizeItem from "@/components/resize/ResizeItem";

interface GridItemProps {
  id: string;
  placementId: string;
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
  placementId,
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
  const onDrop = useCreateCollection(placementId ?? "");
  useDraggable(ref, isEditable && !!dropGroup);
  useScrollIntoView(ref);

  const handleDelete = useCallback(
    () => void onDelete(placementId),
    [placementId, onDelete],
  );

  const combinedStyles = useMemo(
    () =>
      ({
        ...style,
        "--columns": columns,
        "--rows": rows,
      }) as React.CSSProperties,
    [style, columns, rows],
  );

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
      data-placement-id={placementId}
      ondrag:drop-on={onDrop}
    >
      {children}
      {isEditable ? (
        <DeleteButton className={styles.delete} onPress={handleDelete} />
      ) : null}
    </resize-item>
  );
}

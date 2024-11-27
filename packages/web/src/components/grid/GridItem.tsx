import { useCallback, useMemo, useRef } from "react";
import { classNames } from "@/utils/css";
import useDraggable from "@/hooks/useDraggable";
import DeleteButton from "../tiles/DeleteButton";
import styles from "./GridItem.module.css";

interface GridItemProps {
  id?: string;
  style?: React.CSSProperties;
  className?: string;
  rows: number;
  columns: number;
  grow?: boolean;
  isEditable?: boolean;
  dropGroup?: string;
  onDelete: (id?: string) => void;
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
  dropGroup,
  onDelete,
  children,
}: GridItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDraggable(ref, isEditable && !!dropGroup);

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

  return (
    <resize-item
      id={id}
      ref={ref}
      disabled={!isEditable ? "disabled" : undefined}
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

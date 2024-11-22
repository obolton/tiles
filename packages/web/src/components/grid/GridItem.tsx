import { useMemo, useRef } from "react";
import { classNames } from "@/utils/css";
import useDraggable from "@/hooks/useDraggable";
import DeleteButton from "../tiles/DeleteButton";
import styles from "./GridItem.module.css";

interface GridItemProps {
  id?: string;
  className?: string;
  rows: number;
  columns: number;
  grow?: boolean;
  popOut: boolean;
  popOutOrigin?: "center" | "top-left";
  isEditable?: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}

export default function GridItem({
  id,
  className,
  rows,
  columns,
  grow = false,
  popOut,
  popOutOrigin,
  isEditable = false,
  onDelete,
  children,
}: GridItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDraggable(ref, isEditable);

  const style = useMemo(
    () =>
      ({
        "--columns": columns,
        "--rows": rows,
      }) as React.CSSProperties,
    [columns, rows],
  );

  return (
    <resize-item
      id={id}
      ref={ref}
      disabled={!isEditable ? "disabled" : undefined}
      class={classNames(styles.item, grow && styles.grow, className)}
      style={style}
      data-rows={rows}
      data-columns={columns}
      data-drop-target={isEditable ? "true" : undefined}
    >
      <pop-out
        class={classNames(styles["pop-out"])}
        tabindex="0"
        expandable={popOut ? "expandable" : undefined}
        origin={popOutOrigin}
      >
        {children}
        {isEditable ? (
          <DeleteButton className={styles.delete} onPress={onDelete} />
        ) : null}
      </pop-out>
    </resize-item>
  );
}

import { makeDraggable } from "@/utils/drag";
import styles from "./PagesGridItem.module.css";
import type { JSX } from "@/jsx/jsx";

interface PagesGridItemProps {
  id?: string;
  draggable?: boolean;
  children: JSX.Node;
  signal?: AbortSignal;
}

export default function PagesGridItem({
  id,
  draggable,
  children,
  signal,
}: PagesGridItemProps) {
  return (
    <div
      ref={
        draggable ? (element) => makeDraggable(element, { signal }) : undefined
      }
      className={styles.item}
      data-id={id}
    >
      {children}
    </div>
  );
}

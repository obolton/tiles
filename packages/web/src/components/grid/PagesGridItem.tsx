import styles from "./PagesGridItem.module.css";
import type { JSX } from "@/jsx/jsx";

interface PagesGridItemProps {
  children: JSX.Node;
}

export default function PagesGridItem({ children }: PagesGridItemProps) {
  return <div className={styles.item}>{children}</div>;
}

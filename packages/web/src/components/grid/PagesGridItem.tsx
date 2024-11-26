import styles from "./PagesGridItem.module.css";

interface PagesGridItemProps {
  children: React.ReactNode;
}

export default function PagesGridItem({ children }: PagesGridItemProps) {
  return <div className={styles.item}>{children}</div>;
}

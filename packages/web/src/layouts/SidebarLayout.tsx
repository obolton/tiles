import styles from "./SidebarLayout.module.css";
import type { JSX } from "@/jsx/jsx";

export interface SidebarLayoutProps {
  sidebar: JSX.Node;
  children: JSX.Node;
}

export default function SidebarLayout({ sidebar, children }: SidebarLayoutProps) {
  return (
    <main className={styles.main}>
      <section className={styles.sidebar}>{sidebar}</section>
      <section className={styles.content}>{children}</section>
    </main>
  );
}

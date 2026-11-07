import PageLayout from "@/layouts/PageLayout";
import { SITE_NAME } from "@/constants/site";
import styles from "./CardLayout.module.css";
import type { JSX } from "jsx/jsx";

export interface CardLayoutProps {
  /** A short label above the heading, such as a status code. */
  eyebrow?: string;
  title: string;
  description?: string;
  children?: JSX.Node;
}

/** A single card on an animated background, for standalone pages such as sign-in and errors. */
export default function CardLayout({ eyebrow, title, description, children }: CardLayoutProps) {
  return (
    <PageLayout>
      <main className={styles.page}>
        <div className={styles.background} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <a className={styles.wordmark} href="/">
          {SITE_NAME}
        </a>

        <section className={styles.card} aria-labelledby="card-heading">
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 id="card-heading">{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
          {children}
        </section>
      </main>
    </PageLayout>
  );
}

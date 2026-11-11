import PageLayout from "@/layouts/PageLayout";
import { SITE_NAME } from "@/constants/site";
import LogoIcon from "@/icons/logo.svg?jsx";
import styles from "./CardLayout.module.css";
import type { JSX } from "jsx/jsx";

export interface CardLayoutProps {
  title: string;
  description?: string;
  children?: JSX.Node;
}

/** A single card on an animated background, for standalone pages such as sign-in and errors. */
export default function CardLayout({ title, description, children }: CardLayoutProps) {
  return (
    <PageLayout>
      <main className={styles.page}>
        <div className={styles.background} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <a className={styles.wordmark} href="/">
          <LogoIcon aria-hidden="true" />
          {SITE_NAME}
        </a>

        <section className={styles.card} aria-labelledby="card-heading">
          <h1 id="card-heading">{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
          {children}
        </section>
      </main>
    </PageLayout>
  );
}

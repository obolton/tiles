import styles from "./Row.module.css";
import type { JSX } from "jsx/jsx";
import type { Reactive } from "carillon";

export interface RowProps {
  title: string | Reactive<string>;
  subtitle?: string | Reactive<string>;
  icon?: JSX.Node;
  controls?: JSX.Node;
}

export default function Row({ title, subtitle, icon, controls }: RowProps) {
  return (
    <li className={styles.row}>
      {icon}

      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </div>

      {controls}
    </li>
  );
}

import RemoveIcon from "@/icons/remove.svg?jsx";
import styles from "./Row.module.css";
import type { JSX } from "@/jsx/jsx";

export interface RowProps<T> {
  data: T;
  title: string;
  subtitle?: string;
  icon?: JSX.Node;
  showRemoveButton?: boolean;
  onRemove?: (data: T) => void;
}

export default function Row<T>({
  data,
  title,
  subtitle,
  icon,
  showRemoveButton = false,
  onRemove,
}: RowProps<T>) {
  return (
    <li className={styles.row}>
      {icon}

      <div className={styles.text}>
        <span className={styles.title}>{title}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </div>

      {showRemoveButton ? (
        <button
          type="button"
          className="floating small"
          aria-label="Remove"
          on:click={onRemove ? () => onRemove(data) : undefined}
        >
          <RemoveIcon aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}

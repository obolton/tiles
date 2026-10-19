import styles from "./Placeholder.module.css";
import { classNames } from "@/utils/css";
import type { JSX } from "jsx/jsx";

interface PlaceholderProps {
  className?: string;
  children?: JSX.Node;
  actions?: JSX.Node;
}

export default function Placeholder({ className, children, actions }: PlaceholderProps) {
  return (
    <div className={classNames(styles.placeholder, className)}>
      {children ? <p>{children}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}

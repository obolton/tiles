import styles from "./Placeholder.module.css";
import { classNames } from "@/utils/css";

interface PlaceholderProps {
  className?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Placeholder({
  className,
  children,
  actions,
}: PlaceholderProps) {
  return (
    <section className={classNames(styles.placeholder, className)}>
      {children ? <p>{children}</p> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}

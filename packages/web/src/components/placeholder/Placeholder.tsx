import styles from "./Placeholder.module.css";

interface PlaceholderProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Placeholder({ children, actions }: PlaceholderProps) {
  return (
    <section className={styles.placeholder}>
      <p>{children}</p>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}

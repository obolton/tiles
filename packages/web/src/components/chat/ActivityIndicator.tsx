import styles from "./ActivityIndicator.module.css";

export default function ActivityIndicator() {
  return (
    <div className={styles.indicator} role="status" aria-label="AI is working">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </div>
  );
}

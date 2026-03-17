import styles from "./ActionChip.module.css";
import type { ChatAction } from "./types";

export interface ActionChipProps {
  action: ChatAction;
}

export default function ActionChip({ action }: ActionChipProps) {
  return <span className={styles.chip}>{action.description}</span>;
}

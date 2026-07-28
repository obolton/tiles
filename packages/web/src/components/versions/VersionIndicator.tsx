import { formatRelativeDate } from "@/utils/dates";
import styles from "./VersionIndicator.module.css";
import type { VersionEntry } from "./VersionHistory";

export interface VersionIndicatorProps {
  version: VersionEntry;
}

export default function VersionIndicator({ version }: VersionIndicatorProps) {
  const createdAt = new Date(version.createdAt);

  return (
    <time
      className={styles.indicator}
      datetime={createdAt.toISOString()}
      data-tooltip={createdAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    >
      {formatRelativeDate(createdAt)}
    </time>
  );
}

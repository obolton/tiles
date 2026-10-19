import ProfileImage from "@/components/profile-image/ProfileImage";
import HistoryIcon from "@/icons/history.svg?jsx";
import DocumentIcon from "@/icons/document.svg?jsx";
import { formatRelativeDate } from "@/utils/dates";
import styles from "./VersionListItem.module.css";
import type { VersionEntry } from "./VersionHistory";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export interface VersionListItemProps {
  version?: VersionEntry;
  selected: Reactive<boolean>;
  onSelect: () => void;
}

function CurrentVersionContent(): JSX.Node {
  return (
    <>
      <span className={styles.icon} aria-hidden="true">
        <DocumentIcon />
      </span>

      <span className={styles.details}>
        <span className={styles.title}>Current version</span>
      </span>
    </>
  );
}

function VersionContent({ version }: { version: VersionEntry }): JSX.Node {
  const createdAt = new Date(version.createdAt);

  const time = (
    <time
      datetime={createdAt.toISOString()}
      data-tooltip={createdAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    >
      {formatRelativeDate(createdAt)}
    </time>
  );

  return (
    <>
      {version.user ? (
        <ProfileImage imageUrl={version.user.imageUrl} name={version.user.name} size="small" />
      ) : (
        <span className={styles.icon} aria-hidden="true">
          <HistoryIcon />
        </span>
      )}

      <span className={styles.details}>
        {version.type === "AUTO" ? (
          <span className={styles.title}>{time}</span>
        ) : (
          <>
            <span className={styles.title}>
              {version.type === "PRE_RESTORE" ? "Before restore" : (version.name ?? "Unnamed")}
            </span>
            <span className={styles.subtitle}>
              {version.user ? (
                <>
                  {version.user.name} · {time}
                </>
              ) : (
                time
              )}
            </span>
          </>
        )}
      </span>
    </>
  );
}

export default function VersionListItem({ version, selected, onSelect }: VersionListItemProps) {
  return (
    <li>
      <button
        type="button"
        classList={{ option: true, [styles.version]: true }}
        aria-current={selected.derive((value) => (value ? "true" : undefined))}
        on:click={onSelect}
      >
        {version ? <VersionContent version={version} /> : <CurrentVersionContent />}
      </button>
    </li>
  );
}

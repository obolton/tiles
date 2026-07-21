import ProfileImage from "@/components/profile-image/ProfileImage";
import HistoryIcon from "@/icons/history.svg?jsx";
import { formatRelativeDate } from "@/utils/dates";
import styles from "./VersionListItem.module.css";
import type { VersionEntry } from "./VersionHistory";
import type { Reactive } from "@/utils/reactivity";

export interface VersionListItemProps {
  version: VersionEntry;
  selected: Reactive<boolean>;
  onSelect: () => void;
}

export default function VersionListItem({ version, selected, onSelect }: VersionListItemProps) {
  const createdAt = new Date(version.createdAt);
  const author = version.user?.name ?? "Automatic";

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
    <li>
      <button
        type="button"
        classList={{ option: true, [styles.version]: true }}
        aria-current={selected.derive((value) => (value ? "true" : undefined))}
        on:click={onSelect}
      >
        {version.user ? (
          <ProfileImage imageUrl={version.user.imageUrl} name={version.user.name} size="small" />
        ) : (
          <span className={styles.avatar} aria-hidden="true">
            <HistoryIcon />
          </span>
        )}

        <span className={styles.details}>
          {version.type === "AUTO" ? (
            <>
              <span className={styles.title}>{time}</span>
              <span className={styles.subtitle}>{author}</span>
            </>
          ) : (
            <>
              <span className={styles.title}>
                {version.type === "PRE_RESTORE" ? "Before restore" : (version.name ?? "Unnamed")}
              </span>
              <span className={styles.subtitle}>
                {author} · {time}
              </span>
            </>
          )}
        </span>
      </button>
    </li>
  );
}

import ProfileImage from "@/components/profile-image/ProfileImage";
import PublicIcon from "@/icons/public.svg?jsx";
import { makeDraggable } from "@/utils/drag";
import { getThemeStyles } from "@/utils/themes";
import { formatRelativeDate } from "@/utils/dates";
import styles from "./LibraryCard.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { AppRouterOutputs } from "@/api/client";

export type LibraryPage = AppRouterOutputs["pages"]["list"]["pages"][number];

export interface LibraryCardProps {
  page: LibraryPage;
  selected?: boolean | Reactive<boolean>;
  onToggle?: () => void;
  draggable?: boolean;
}

export default function LibraryCard({
  page,
  selected,
  onToggle,
  draggable,
}: LibraryCardProps) {
  const updatedAt = new Date(page.updatedAt);

  function onCheckboxChange(event: Event) {
    event.stopPropagation();
    onToggle?.();
  }

  return (
    <article
      ref={
        draggable
          ? (element) => makeDraggable(element, { clone: true })
          : undefined
      }
      classList={{
        [styles.card]: true,
        [styles.selected]: selected,
      }}
      style={getThemeStyles(page.theme, {
        background: page.background,
        font: page.font,
      })}
      data-id={page.id}
    >
      <a className={styles.link} href={`/pages/${page.id}`}>
        <p className={styles.title}>{page.title}</p>

        <div className={styles.details}>
          <div className={styles.meta}>
            <time
              datetime={updatedAt.toISOString()}
              data-tooltip={updatedAt.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            >
              {formatRelativeDate(updatedAt)}
            </time>
            {page.folder ? (
              <span className={styles.folder}>{page.folder.name}</span>
            ) : null}
            {page.published ? (
              <PublicIcon
                className={styles.published}
                aria-label="Published"
                data-tooltip="Published"
              />
            ) : null}
          </div>

          <div className={styles.author}>
            <ProfileImage
              imageUrl={page.author.imageUrl}
              name={page.author.name}
            />
            <span className={styles["author-name"]}>{page.author.name}</span>
          </div>
        </div>
      </a>

      {selected != null ? (
        <input
          type="checkbox"
          classList={{
            [styles.checkbox]: true,
            [styles.visible]: selected,
          }}
          checked={selected}
          on:change={onCheckboxChange}
          aria-label={`Select ${page.title}`}
        />
      ) : null}
    </article>
  );
}

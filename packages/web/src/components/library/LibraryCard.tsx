import ProfileImage from "@/components/profile-image/ProfileImage";
import PublicIcon from "@/icons/public.svg?jsx";
import DocumentIcon from "@/icons/document.svg?jsx";
import PresentationIcon from "@/icons/presentation.svg?jsx";
import EmptyIcon from "@/icons/empty.svg?jsx";
import { makeDraggable } from "@/utils/drag";
import { formatRelativeDate } from "@/utils/dates";
import styles from "./LibraryCard.module.css";
import type { Reactive } from "carillon";
import type { AppRouterOutputs } from "@/api/client";
import type { PageType } from "api/types/pages";
import type { JSX } from "jsx/jsx";

export type LibraryPage = AppRouterOutputs["pages"]["list"]["pages"][number];

const PAGE_TYPES: Record<PageType, { Icon: JSX.Component<JSX.Attributes<"svg">>; label: string }> =
  {
    DOCUMENT: { Icon: DocumentIcon, label: "Document" },
    PRESENTATION: { Icon: PresentationIcon, label: "Presentation" },
    LAYOUT: { Icon: EmptyIcon, label: "Layout" },
  };

export interface LibraryCardProps {
  page: LibraryPage;
  selected?: boolean | Reactive<boolean>;
  onToggle?: () => void;
  draggable?: boolean;
  link?: boolean;
  showFolder?: boolean;
}

export default function LibraryCard({
  page,
  selected,
  onToggle,
  draggable,
  link = true,
  showFolder = true,
}: LibraryCardProps) {
  const updatedAt = new Date(page.updatedAt);
  const { Icon: TypeIcon, label: typeLabel } = PAGE_TYPES[page.type];

  function onCheckboxChange(event: Event) {
    event.stopPropagation();
    onToggle?.();
  }

  const content = (
    <>
      <p className={styles.title}>
        <span>{page.title}</span>
      </p>

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
          {showFolder && page.folder ? (
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
          <ProfileImage imageUrl={page.author.imageUrl} name={page.author.name} />
          <span className={styles["author-name"]}>{page.author.name}</span>
        </div>
      </div>
    </>
  );

  return (
    <article
      ref={draggable ? (element) => makeDraggable(element, { clone: true }) : undefined}
      classList={{
        [styles.card]: true,
        [styles.selected]: selected,
      }}
      data-id={page.id}
    >
      {link ? (
        <a className={styles.link} href={`/pages/${page.id}`}>
          {content}
        </a>
      ) : (
        <div className={styles.link}>{content}</div>
      )}

      <TypeIcon className={styles.type} aria-label={typeLabel} data-tooltip={typeLabel} />

      {selected != null ? (
        <input
          type="checkbox"
          classList={{
            [styles.checkbox]: true,
            [styles.visible]: selected,
          }}
          bind:checked={selected}
          on:change={onCheckboxChange}
          aria-label={`Select ${page.title}`}
        />
      ) : null}
    </article>
  );
}

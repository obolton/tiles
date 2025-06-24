import Tile from "./Tile";
import PageTile from "./PageTile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageLinkTile.module.css";
import { classNames } from "@/utils/css";
import { isDark } from "@/utils/color";
import type Editor from "@/editor/Editor";
import type { PageLinkProperties } from "@/types/tiles";

interface PageLinkTileProps extends PageLinkProperties {
  editor?: Editor;
  onClick?: (event: MouseEvent) => void;
  openInNewTab?: boolean;
}

export default function PageLinkTile({
  editor,
  linkedPage,
  onClick,
  openInNewTab = true,
}: PageLinkTileProps) {
  if (!linkedPage.value) {
    return (
      <Tile>
        <div className={styles.deleted}>This page has been deleted.</div>
      </Tile>
    );
  }

  function handleClick(event: MouseEvent) {
    if (onClick) {
      onClick(event);
    } else if (
      editor?.isEditable.value &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      !event.metaKey
    ) {
      event.preventDefault();
    }
  }

  return (
    <a
      className={styles.link}
      href={`/pages/${linkedPage.value.id}`}
      target={openInNewTab ? "_blank" : undefined}
      onclick={handleClick}
    >
      <PageTile
        title={linkedPage.value.title}
        font={linkedPage.value.font}
        color={linkedPage.value.color}
        coverImageUrl={linkedPage.value.coverImageUrl}
      />

      {openInNewTab ? (
        <ArrowOutwardIcon
          className={classNames(
            styles.icon,
            isDark(linkedPage.value.color) && styles.dark,
          )}
          aria-hidden="true"
        />
      ) : null}
    </a>
  );
}

import Tile from "./Tile";
import PageTile from "./PageTile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageLinkTile.module.css";
import { classNames } from "@/utils/css";
import { isDark } from "@/utils/color";
import type PageLink from "@/items/PageLink";

export interface PageLinkTileProps {
  pageLink: PageLink;
  onClick?: (event: MouseEvent) => void;
  openInNewTab?: boolean;
}

export default function PageLinkTile({
  pageLink,
  onClick,
  openInNewTab = true,
}: PageLinkTileProps) {
  const {
    page,
    editor: { isEditable },
  } = pageLink;

  if (!page) {
    return (
      <Tile>
        <div className={styles.deleted}>This page has been deleted.</div>
      </Tile>
    );
  }

  function handleClick(event: PointerEvent) {
    if (onClick) {
      onClick(event);
    } else if (
      isEditable.value &&
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
      href={`/pages/${page.id}`}
      target={openInNewTab ? "_blank" : undefined}
      tabindex={isEditable.derive((value) => (value ? -1 : undefined))}
      on:click={handleClick}
    >
      <PageTile
        title={page.title}
        font={page.font}
        background={page.background}
      />

      {openInNewTab ? (
        <ArrowOutwardIcon
          className={classNames(
            styles.icon,
            page.background &&
              !("imageUrl" in page.background) &&
              isDark(page.background) &&
              styles.dark,
          )}
          aria-hidden="true"
        />
      ) : null}
    </a>
  );
}

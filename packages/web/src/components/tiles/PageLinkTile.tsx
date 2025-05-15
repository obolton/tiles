import Tile from "./Tile";
import PageTile from "./PageTile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageLinkTile.module.css";
import { classNames } from "@/utils/css";
import { isDark } from "@/utils/color";
import type { ClientPageLink } from "@/types/tiles";
import type Editor from "@/editor/Editor";

interface PageLinkTileProps extends ClientPageLink {
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
  if (!linkedPage) {
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

  const color = {
    l: linkedPage.lightness,
    c: linkedPage.chroma,
    h: linkedPage.hue,
  };

  return (
    <a
      className={styles.link}
      href={`/pages/${linkedPage.id}`}
      target={openInNewTab ? "_blank" : undefined}
      onclick={handleClick}
      draggable={editor?.isEditable.derive((value) =>
        value ? false : undefined,
      )}
    >
      <PageTile
        title={linkedPage.title}
        subtitle={linkedPage.subtitle}
        author={linkedPage.author}
        hue={linkedPage.hue}
        font={linkedPage.font}
        color={color}
        coverImageUrl={linkedPage.coverImageUrl}
      />

      {openInNewTab ? (
        <ArrowOutwardIcon
          className={classNames(styles.icon, isDark(color) && styles.dark)}
          aria-hidden="true"
        />
      ) : null}
    </a>
  );
}

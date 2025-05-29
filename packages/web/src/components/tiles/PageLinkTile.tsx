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

  const color =
    typeof linkedPage.value.lightness === "number" &&
    typeof linkedPage.value.chroma === "number" &&
    typeof linkedPage.value.hue === "number"
      ? {
          l: linkedPage.value.lightness,
          c: linkedPage.value.chroma,
          h: linkedPage.value.hue,
        }
      : null;

  return (
    <a
      className={styles.link}
      href={`/pages/${linkedPage.value.id}`}
      target={openInNewTab ? "_blank" : undefined}
      onclick={handleClick}
      draggable={editor?.isEditable.derive((value) =>
        value ? false : undefined,
      )}
    >
      <PageTile
        title={linkedPage.value.title}
        subtitle={linkedPage.value.subtitle}
        hue={linkedPage.value.hue}
        font={linkedPage.value.font}
        color={color}
        coverImageUrl={linkedPage.value.coverImageUrl}
      />

      {openInNewTab ? (
        <ArrowOutwardIcon
          className={classNames(
            styles.icon,
            color && isDark(color) && styles.dark,
          )}
          aria-hidden="true"
        />
      ) : null}
    </a>
  );
}

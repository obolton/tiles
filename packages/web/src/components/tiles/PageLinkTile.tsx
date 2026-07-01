import Tile from "./Tile";
import LinkToolbar from "@/components/toolbars/links/LinkToolbar";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import styles from "./PageLinkTile.module.css";
import Editor from "@/editor/Editor";
import type PageLink from "@/models/PageLink";
import type { Reactive } from "@/utils/reactivity";

export interface PageLinkTileProps {
  pageLink: PageLink;
  showToolbar: Reactive<boolean>;
}

function onClick(event: PointerEvent) {
  if (
    Editor.current.isEditable.value &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.metaKey
  ) {
    event.preventDefault();
  }
}

export default function PageLinkTile({
  pageLink,
  showToolbar,
}: PageLinkTileProps) {
  const linkedPage = pageLink.linkedPage.value;

  if (!linkedPage) {
    return (
      <Tile classList={{ [styles.deleted]: true }}>
        <p>This page has been deleted.</p>
      </Tile>
    );
  }

  return (
    <Tile classList={{ [styles.tile]: true }}>
      <a
        className={styles.link}
        href={`/pages/${linkedPage.id}`}
        target="_blank"
        on:click={onClick}
      >
        <p className={styles.text}>{linkedPage.title}</p>

        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </a>

      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <LinkToolbar link={pageLink} />
        </Portal>
      </If>
    </Tile>
  );
}

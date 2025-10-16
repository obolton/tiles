import Tile from "./Tile";
import PageTile from "./PageTile";
import styles from "./PageLinkTile.module.css";
import type PageLink from "@/items/PageLink";

export interface PageLinkTileProps {
  pageLink: PageLink;
}

export default function PageLinkTile({ pageLink }: PageLinkTileProps) {
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
    if (
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
    <PageTile
      id={page.id}
      title={page.title}
      font={page.font}
      target="_blank"
      background={page.background}
      on:click={handleClick}
    />
  );
}

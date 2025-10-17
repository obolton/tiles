import Tile from "./Tile";
import PageLinkComponent from "./PageLink";
import styles from "./PageLinkTile.module.css";
import Editor from "@/editor/Editor";
import type PageLink from "@/models/PageLink";

export interface PageLinkTileProps {
  pageLink: PageLink;
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

export default function PageLinkTile({ pageLink }: PageLinkTileProps) {
  const { page } = pageLink;

  if (!page) {
    return (
      <Tile className={styles.deleted}>
        <p>This page has been deleted.</p>
      </Tile>
    );
  }

  return (
    <PageLinkComponent
      pageId={page.id}
      title={page.title}
      font={page.font}
      background={page.background}
      target="_blank"
      on:click={onClick}
    />
  );
}

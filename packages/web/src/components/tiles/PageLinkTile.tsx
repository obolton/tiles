import Tile from "./Tile";
import PageLinkComponent from "./PageLink";
import LinkToolbar from "@/components/toolbars/links/LinkToolbar";
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
      background={page.background}
      target="_blank"
      on:click={onClick}
    >
      <If condition={showToolbar}>
        <Portal>
          <LinkToolbar link={pageLink} />
        </Portal>
      </If>
    </PageLinkComponent>
  );
}

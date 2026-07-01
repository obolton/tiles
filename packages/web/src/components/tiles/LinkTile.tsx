import Tile from "./Tile";
import LinkToolbar from "@/components/toolbars/links/LinkToolbar";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import styles from "./LinkTile.module.css";
import type Link from "@/models/Link";
import type { Reactive } from "@/utils/reactivity";

export interface LinkTileProps {
  link: Link;
  showToolbar: Reactive<boolean>;
}

export default function LinkTile({ link, showToolbar }: LinkTileProps) {
  const { url, title, description, siteName, editor } = link;
  const { isEditable } = editor;
  const contents = (
    <div className={styles.caption}>
      <p className={styles.title}>{title}</p>
      <If condition={description}>
        <p>{description}</p>
      </If>
      <If condition={siteName}>
        <p>{siteName}</p>
      </If>
    </div>
  );

  function onClick(event: Event) {
    if (isEditable.value) {
      event.preventDefault();
    }
  }

  return (
    <Tile>
      <a className={styles.link} href={url} target="_blank" rel="noreferrer ugc" on:click={onClick}>
        {contents}
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </a>

      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <LinkToolbar link={link} />
        </Portal>
      </If>
    </Tile>
  );
}

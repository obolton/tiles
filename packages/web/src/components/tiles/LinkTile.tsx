import Tile from "./Tile";
import LinkToolbar from "@/components/toolbars/links/LinkToolbar";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import If from "jsx/if";
import Portal from "jsx/portal";
import { combine } from "reactivity";
import { formatUrl } from "@/utils/urls";
import styles from "./LinkTile.module.css";
import type Link from "@/models/Link";
import type { Reactive } from "reactivity";

export interface LinkTileProps {
  link: Link;
  showToolbar: Reactive<boolean>;
}

/** The card's caption: the page's preview, or the URL itself when there is no preview. */
export function LinkCaption({ link }: { link: Link }) {
  const { url, title, description, siteName } = link;
  const heading = combine({ url, title }, ({ url, title }) => title ?? formatUrl(url));

  return (
    <div className={styles.caption}>
      <p className={styles.title}>{heading}</p>
      <If condition={description}>
        <p>{description}</p>
      </If>
      <If condition={siteName}>
        <p>{siteName}</p>
      </If>
    </div>
  );
}

export default function LinkTile({ link, showToolbar }: LinkTileProps) {
  const { url, editor } = link;
  const { isEditable } = editor;

  function onClick(event: Event) {
    if (isEditable.value) {
      event.preventDefault();
    }
  }

  return (
    <Tile>
      <a className={styles.link} href={url} target="_blank" rel="noreferrer ugc" on:click={onClick}>
        <LinkCaption link={link} />
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

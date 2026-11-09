import Tile from "./Tile";
import If from "jsx/if";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./LinkTile.module.css";
import type Link from "@/models/Link";

export interface LinkTileThumbnailProps {
  link: Link;
}

export default function LinkTileThumbnail({ link }: LinkTileThumbnailProps) {
  const { displayTitle, description, siteName } = link;
  return (
    <Tile>
      <div className={styles.link}>
        <div className={styles.caption}>
          <p className={styles.title}>{displayTitle}</p>
          <If condition={description}>
            <p>{description}</p>
          </If>
          <If condition={siteName}>
            <p>{siteName}</p>
          </If>
        </div>
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </div>
    </Tile>
  );
}

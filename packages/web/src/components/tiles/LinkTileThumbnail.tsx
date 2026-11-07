import Tile from "./Tile";
import { LinkCaption } from "./LinkTile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./LinkTile.module.css";
import type Link from "@/models/Link";

export interface LinkTileThumbnailProps {
  link: Link;
}

export default function LinkTileThumbnail({ link }: LinkTileThumbnailProps) {
  return (
    <Tile>
      <div className={styles.link}>
        <LinkCaption link={link} />
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </div>
    </Tile>
  );
}

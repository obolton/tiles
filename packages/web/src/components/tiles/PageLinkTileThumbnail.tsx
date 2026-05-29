import Tile from "./Tile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import styles from "./PageLinkTile.module.css";
import type PageLink from "@/models/PageLink";

export interface PageLinkTileThumbnailProps {
  pageLink: PageLink;
}

export default function PageLinkTileThumbnail({
  pageLink,
}: PageLinkTileThumbnailProps) {
  const { linkedPage } = pageLink;

  if (!linkedPage) {
    return (
      <Tile classList={{ [styles.deleted]: true }}>
        <p>This page has been deleted.</p>
      </Tile>
    );
  }

  return (
    <Tile classList={{ [styles.tile]: true }}>
      <div className={styles.link}>
        <p
          classList={{
            [styles.text]: true,
            [styles["with-image"]]:
              linkedPage.value?.background &&
              "imageUrl" in linkedPage.value.background,
          }}
        >
          {linkedPage.value?.title}
        </p>
        <ArrowOutwardIcon className={styles.icon} aria-hidden="true" />
      </div>
    </Tile>
  );
}

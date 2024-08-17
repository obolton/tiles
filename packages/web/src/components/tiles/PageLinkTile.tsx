import { getImageUrl } from "@/utils/images";
import Tile from "./Tile";
import Icon from "@/components/icons/Icon";
import arrowOutwardIcon from "@/icons/arrow-outward.svg";
import styles from "./PageLinkTile.module.css";
import type { ClientPageLinkTile } from "@/types/tiles";

type PageLinkTileProps = {
  tile: ClientPageLinkTile;
};

export default function PageLinkTile({ tile }: PageLinkTileProps) {
  const {
    pageLink: { pageId, page },
  } = tile;

  if (!page) {
    return (
      <Tile tile={tile} showInLightbox={false}>
        <div className={`${styles.contents} ${styles.deleted}`}>
          This page no longer exists.
        </div>
      </Tile>
    );
  }

  const { title, subtitle, author, imageKey } = page;

  return (
    <Tile
      tile={tile}
      showInLightbox={false}
      theme={page.theme as "LIGHT" | "DARK" | "COLOR"}
      hue={page.hue}
      font={page.font}
    >
      {/* eslint-disable-next-line react/jsx-no-target-blank */}
      <a
        className={`${styles.contents} ${page.theme === "LIGHT" ? styles.light : page.theme === "DARK" ? styles.dark : styles.color}`}
        style={
          imageKey
            ? { backgroundImage: `url(${getImageUrl(imageKey)})` }
            : undefined
        }
        href={`/pages/${pageId}`}
        target="_blank"
      >
        <Icon src={arrowOutwardIcon.src} className={styles.icon} />

        <section
          className={`${styles.text} ${imageKey ? styles["with-image"] : ""}`}
        >
          <h3>{title}</h3>

          {subtitle ? <p>{subtitle}</p> : null}

          <address>
            <profile-image src={author.imageUrl} name={author.name} />
            {author.name}
          </address>
        </section>
      </a>
    </Tile>
  );
}

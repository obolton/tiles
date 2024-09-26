import { getImageUrl } from "@/utils/images";
import Tile, { type TileProps } from "./Tile";
import styles from "./PageLinkTile.module.css";
import { classNames } from "@/utils/css";
import type { ClientPageLink } from "@/types/tiles";

interface PageLinkTileProps extends TileProps {
  pageLink: ClientPageLink;
}

export default function PageLinkTile({
  pageLink,
  ...props
}: PageLinkTileProps) {
  const { pageId, page } = pageLink;

  if (!page) {
    return (
      <Tile {...props}>
        <div className={`${styles.contents} ${styles.deleted}`}>
          This page no longer exists.
        </div>
      </Tile>
    );
  }

  const { title, subtitle, author, imageKey } = page;

  return (
    <Tile
      {...props}
      theme={page.theme as "LIGHT" | "DARK" | "COLOR"}
      hue={page.hue}
      font={page.font}
    >
      <a
        className={classNames(
          styles.contents,
          page.theme === "LIGHT"
            ? styles.light
            : page.theme === "DARK"
              ? styles.dark
              : styles.color,
        )}
        style={
          imageKey
            ? { backgroundImage: `url(${getImageUrl(imageKey)})` }
            : undefined
        }
        href={`/pages/${pageId}`}
        target="_blank"
      >
        <section
          className={classNames(styles.text, imageKey && styles["with-image"])}
        >
          <h3>{title}</h3>

          {subtitle ? <p>{subtitle}</p> : null}

          <address>
            <profile-image src={author.imageUrl} name={author.name} />
            <span>{author.name}</span>
          </address>
        </section>
      </a>
    </Tile>
  );
}

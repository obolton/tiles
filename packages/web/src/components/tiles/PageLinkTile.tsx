import { getImageUrl } from "@/utils/images";
import Tile, { type TileProps } from "./Tile";
import styles from "./PageLinkTile.module.css";
import type { ClientPageLink } from "@/types/tiles";
import PageTile from "./PageTile";

interface PageLinkTileProps extends TileProps, ClientPageLink {
  onClick?: (event: React.MouseEvent) => void;
}

export default function PageLinkTile({
  id,
  pageId,
  page,
  onClick,
  ...props
}: PageLinkTileProps) {
  if (!page) {
    return (
      <Tile id={id} {...props}>
        <div className={styles.deleted}>This page no longer exists.</div>
      </Tile>
    );
  }

  return (
    <a
      className={styles.link}
      href={`/pages/${pageId}`}
      target="_blank"
      onClick={onClick}
    >
      <PageTile
        id={id}
        title={page.title}
        subtitle={page.subtitle}
        author={page.author}
        hue={page.hue}
        font={page.font}
        theme={page.theme}
        imageUrl={page.imageKey ? getImageUrl(page.imageKey) : undefined}
      />
    </a>
  );
}

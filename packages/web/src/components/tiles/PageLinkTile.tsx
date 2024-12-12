import { getImageUrl } from "@/utils/images";
import Tile from "./Tile";
import styles from "./PageLinkTile.module.css";
import type { ClientPageLink } from "@/types/tiles";
import PageTile from "./PageTile";

interface PageLinkTileProps extends ClientPageLink {
  onClick?: (event: React.MouseEvent) => void;
}

export default function PageLinkTile({
  pageId,
  page,
  onClick,
}: PageLinkTileProps) {
  if (!page) {
    return (
      <Tile>
        <div className={styles.deleted}>This page has been deleted.</div>
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

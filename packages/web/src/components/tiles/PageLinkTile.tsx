import Tile from "./Tile";
import styles from "./PageLinkTile.module.css";
import type { ClientPageLink } from "@/types/tiles";
import PageTile from "./PageTile";
import { classNames } from "@/utils/css";

interface PageLinkTileProps extends ClientPageLink {
  onClick?: (event: React.MouseEvent) => void;
  openInNewTab?: boolean;
}

export default function PageLinkTile({
  page,
  onClick,
  openInNewTab = true,
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
      className={classNames(styles.link, openInNewTab && styles["new-tab"])}
      href={`/pages/${page.id}`}
      target={openInNewTab ? "_blank" : undefined}
      onClick={onClick}
    >
      <PageTile
        title={page.title}
        subtitle={page.subtitle}
        author={page.author}
        hue={page.hue}
        font={page.font}
        theme={page.theme}
        coverImageUrl={page.coverImageUrl}
      />
    </a>
  );
}

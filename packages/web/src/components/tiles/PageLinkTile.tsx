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
  linkedPage,
  onClick,
  openInNewTab = true,
}: PageLinkTileProps) {
  if (!linkedPage) {
    return (
      <Tile>
        <div className={styles.deleted}>This page has been deleted.</div>
      </Tile>
    );
  }

  return (
    <a
      className={classNames(styles.link, openInNewTab && styles["new-tab"])}
      href={`/pages/${linkedPage.id}`}
      target={openInNewTab ? "_blank" : undefined}
      onClick={onClick}
    >
      <PageTile
        title={linkedPage.title}
        subtitle={linkedPage.subtitle}
        author={linkedPage.author}
        hue={linkedPage.hue}
        font={linkedPage.font}
        theme={linkedPage.theme}
        coverImageUrl={linkedPage.coverImageUrl}
      />
    </a>
  );
}

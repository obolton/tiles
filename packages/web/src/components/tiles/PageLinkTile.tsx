import Tile from "./Tile";
import PageTile from "./PageTile";
import ArrowOutwardIcon from "@/icons/arrow-outward.svg?jsx";
import useEditable from "@/hooks/useEditable";
import styles from "./PageLinkTile.module.css";
import { classNames } from "@/utils/css";
import type { ClientPageLink } from "@/types/tiles";

interface PageLinkTileProps extends ClientPageLink {
  onClick?: (event: React.MouseEvent) => void;
  openInNewTab?: boolean;
}

function preventDefault(event: React.MouseEvent) {
  if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
    return;
  }
  event.preventDefault();
}

export default function PageLinkTile({
  linkedPage,
  onClick,
  openInNewTab = true,
}: PageLinkTileProps) {
  const isEditable = useEditable();

  if (!linkedPage) {
    return (
      <Tile>
        <div className={styles.deleted}>This page has been deleted.</div>
      </Tile>
    );
  }

  return (
    <a
      className={styles.link}
      href={`/pages/${linkedPage.id}`}
      target={openInNewTab ? "_blank" : undefined}
      onClick={onClick ?? (isEditable ? preventDefault : undefined)}
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
      {openInNewTab ? (
        <ArrowOutwardIcon
          className={classNames(
            styles.icon,
            linkedPage.theme === "DARK" && styles.dark,
          )}
          aria-hidden="true"
        />
      ) : null}
    </a>
  );
}

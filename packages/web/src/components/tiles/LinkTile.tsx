import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { editTile } from "@/utils/edit";
import Tile from "./Tile";
import Icon from "@/components/icons/Icon";
import arrowOutwardIcon from "@/icons/arrow-outward.svg";
import styles from "./LinkTile.module.css";
import type { ClientLinkTile } from "@/types/tiles";

type LinkTileProps = {
  tile: ClientLinkTile;
};

export default function LinkTile({ tile }: LinkTileProps) {
  const {
    id,
    link: { url, title, description, siteName, imageUrl },
  } = tile;
  const isEditable = useEditable();
  const edit = useCallback(() => editTile(id, "LINK"), [id]);

  const contents = (
    <>
      <Icon src={arrowOutwardIcon.src} className={styles.icon} />
      <div className={styles.caption}>
        <h3 className={styles.title}>{title || "Unnamed page"}</h3>
        {description && <p>{description}</p>}
        <p>{siteName || url}</p>
      </div>
    </>
  );

  return (
    <Tile tile={tile} showInLightbox={false}>
      {isEditable ? (
        <div
          className={styles.link}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          onClick={edit}
        >
          {contents}
        </div>
      ) : (
        <a
          className={styles.link}
          style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {contents}
        </a>
      )}
    </Tile>
  );
}

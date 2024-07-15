import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { editTile } from "@/utils/edit";
import Tile from "./Tile";
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
  const content = (
    <figure className={styles.figure}>
      {imageUrl && <img src={imageUrl} alt="TODO" />}
      <figcaption>
        <h3 className={styles.title}>{title || "Unnamed page"}</h3>
        {description && <p>{description}</p>}
        <p>{siteName || url}</p>
      </figcaption>
    </figure>
  );
  return (
    <Tile tile={tile} showInLightbox={false}>
      {isEditable ? (
        <div className={styles["link-tile"]} onClick={edit}>
          {content}
        </div>
      ) : (
        <a
          className={styles["link-tile"]}
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {content}
        </a>
      )}
    </Tile>
  );
}

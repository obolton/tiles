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
    <>
      {imageUrl && <img className={styles.image} src={imageUrl} alt="TODO" />}
      <div className={styles.metadata}>
        <h3 className={styles.title}>{title || "Unnamed page"}</h3>
        {description && <p className={styles.meta}>{description}</p>}
        <p className={styles.meta}>{siteName || url}</p>
      </div>
    </>
  );
  return (
    <Tile tile={tile}>
      {isEditable ? (
        <div className={styles["link-tile"]} onClick={edit}>
          {content}
        </div>
      ) : (
        <a className={styles["link-tile"]} href={url}>
          {content}
        </a>
      )}
    </Tile>
  );
}

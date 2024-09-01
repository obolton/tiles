import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { editTile } from "@/utils/edit";
import Tile, { type TileProps } from "./Tile";
import Icon from "@/components/icons/Icon";
import arrowOutwardIcon from "@/icons/arrow-outward.svg";
import styles from "./LinkTile.module.css";
import type { ClientLink } from "@/types/tiles";

interface LinkTileProps extends TileProps {
  link: ClientLink;
}

export default function LinkTile({ id, link, ...props }: LinkTileProps) {
  const { url, title, description, siteName, imageUrl } = link;
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
    <Tile id={id} {...props} showInLightbox={false}>
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

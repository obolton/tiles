import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { getImageUrl } from "@/utils/images";
import { editTile } from "@/utils/edit";
import Tile from "./Tile";
import styles from "./ImageTile.module.css";
import type { ClientImageTile } from "@/types/tiles";

type ImageTileProps = {
  tile: ClientImageTile;
};

export default function ImageTile({ tile }: ImageTileProps) {
  const {
    id,
    image: { imageKey, caption },
  } = tile;
  const isEditable = useEditable();
  const edit = useCallback(() => editTile(id, "IMAGE"), [id]);
  const src = getImageUrl(imageKey);
  return (
    <Tile tile={tile}>
      <figure className={styles.figure} onClick={isEditable ? edit : undefined}>
        <img src={src} alt="Image" draggable={!isEditable} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </Tile>
  );
}

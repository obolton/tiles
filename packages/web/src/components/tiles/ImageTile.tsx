import { useCallback } from "react";
import useEditable from "@/hooks/useEditable";
import { getImageUrl } from "@/utils/images";
import { editTile } from "@/utils/edit";
import Tile, { type TileProps } from "./Tile";
import styles from "./ImageTile.module.css";
import type { ClientImage } from "@/types/tiles";

interface ImageTileProps extends TileProps {
  image: ClientImage;
}

export default function ImageTile({ id, image, ...props }: ImageTileProps) {
  const { imageKey, caption } = image;
  const isEditable = useEditable();
  const edit = useCallback(() => editTile(id, "IMAGE", image), [id, image]);
  const src = getImageUrl(imageKey);
  return (
    <Tile id={id} {...props}>
      <figure className={styles.figure} onClick={isEditable ? edit : undefined}>
        <img src={src} alt="Image" draggable={!isEditable} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </Tile>
  );
}

import useCreateCollection from "@/hooks/useCreateCollection";
import useEditable from "@/hooks/useEditable";
import type { ClientImage } from "@/types/tiles";
import { updateTile } from "@/utils/edit";
import { getImageUrl } from "@/utils/images";
import { useCallback } from "react";
import Caption from "./Caption";
import styles from "./ImageTile.module.css";
import Tile, { type TileProps } from "./Tile";

interface ImageTileProps extends TileProps {
  image: ClientImage;
}

export default function ImageTile({ id, image, ...props }: ImageTileProps) {
  const { imageKey, caption } = image;
  const isEditable = useEditable();
  const src = getImageUrl(imageKey);
  const onDrop = useCreateCollection(id, "STACK");

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await updateTile(id, {
        type: "IMAGE",
        image: { caption: value },
      });
    },
    [id],
  );

  return (
    <Tile id={id} {...props} onDrop={onDrop}>
      <figure
        id={`${id}-figure`}
        className={styles.figure}
        data-show-in-lightbox="true"
      >
        <img src={src} loading="lazy" alt="Image" draggable={!isEditable} />
        <Caption
          isEditable={isEditable}
          value={caption}
          onChange={onUpdateCaption}
          placeholder="Add a caption"
        />
      </figure>
    </Tile>
  );
}

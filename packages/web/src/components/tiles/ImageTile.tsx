import useEditable from "@/hooks/useEditable";
import type { ClientImage } from "@/types/tiles";
import { updateTile } from "@/utils/edit";
import { getImageUrl } from "@/utils/images";
import { useCallback, useMemo, useState } from "react";
import MovableImage from "@/components/images/MovableImage";
import Caption from "./Caption";
import styles from "./ImageTile.module.css";
import Tile, { type TileProps } from "./Tile";

interface ImageTileProps extends TileProps {
  movable?: boolean;
  image: ClientImage;
}

export default function ImageTile({
  id,
  image,
  movable = true,
  ...props
}: ImageTileProps) {
  const { imageKey, caption } = image;
  const isEditable = useEditable();
  const src = getImageUrl(imageKey);
  const [origin, setOrigin] = useState({ x: image.originX, y: image.originY });

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await updateTile(id, {
        type: "IMAGE",
        image: { caption: value },
      });
    },
    [id],
  );

  const onUpdateOrigin = useCallback(
    async (origin: { x: number; y: number }) => {
      await updateTile(id, {
        type: "IMAGE",
        image: { origin },
      });
    },
    [id],
  );

  const style = useMemo(
    () => ({
      objectPosition: `${origin.x * 100}% ${origin.y * 100}%`,
    }),
    [origin],
  );

  return (
    <Tile id={id} {...props}>
      <figure
        id={`${id}-figure`}
        className={styles.figure}
        data-show-in-lightbox="true"
      >
        <MovableImage
          src={src}
          style={style}
          loading="lazy"
          alt="Image"
          movable={movable && isEditable}
          draggable={!isEditable}
          origin={origin}
          onMove={setOrigin}
          onRelease={onUpdateOrigin}
        />
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

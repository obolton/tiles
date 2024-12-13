import useEditable from "@/hooks/useEditable";
import { updateImage } from "@/utils/edit";
import { useCallback, useMemo, useState } from "react";
import MovableImage from "@/components/images/MovableImage";
import Caption from "./Caption";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";

interface ImageTileProps {
  id: string;
  imageUrl: string;
  caption?: string | null;
  originX: number;
  originY: number;
  movable?: boolean;
}

export default function ImageTile({
  id,
  movable = true,
  imageUrl,
  caption,
  originX,
  originY,
}: ImageTileProps) {
  const isEditable = useEditable();
  const [origin, setOrigin] = useState({ x: originX, y: originY });

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await updateImage({ id, caption: value });
    },
    [id],
  );

  const onUpdateOrigin = useCallback(
    async (origin: { x: number; y: number }) => {
      await updateImage({
        id,
        origin,
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
    <Tile>
      <figure
        id={`${id}-figure`}
        className={styles.figure}
        data-show-in-lightbox="true"
      >
        <MovableImage
          src={imageUrl}
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

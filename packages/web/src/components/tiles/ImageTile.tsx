import useEditable from "@/hooks/useEditable";
import { useCallback, useMemo, useState } from "react";
import MovableImage from "@/components/images/MovableImage";
import Caption from "./Caption";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import { useEditor } from "@/context/editor";

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
  const editor = useEditor();
  const isEditable = useEditable();
  const [origin, setOrigin] = useState({ x: originX, y: originY });

  const onUpdateCaption = useCallback(
    async (value: string) => {
      await editor.updateImage({ id, caption: value });
    },
    [editor, id],
  );

  const onUpdateOrigin = useCallback(
    async (origin: { x: number; y: number }) => {
      await editor.updateImage({
        id,
        origin,
      });
    },
    [editor, id],
  );

  const style = useMemo(
    () => ({
      objectPosition: `${origin.x * 100}% ${origin.y * 100}%`,
    }),
    [origin],
  );

  return (
    <Tile border="inside">
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

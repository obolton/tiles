import useEditable from "@/hooks/useEditable";
import { useCallback, useMemo, useState } from "react";
import MovableImage from "@/components/images/MovableImage";
import Caption from "./Caption";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import { useEditor } from "@/context/editor";
import { setSearchParams } from "@/utils/urls";

interface ImageTileProps {
  id: string;
  columns: number;
  imageUrl: string;
  caption?: string | null;
  originX: number;
  originY: number;
  movable?: boolean;
}

interface ImageVariant {
  width: number;
  searchParams: Record<string, string>;
}

const MAX_COLUMN_WIDTH = 256;
const COLUMN_GAP = 16;
const PIXEL_DENSITY = 2;

const VARIANTS: ImageVariant[] = [
  {
    width: MAX_COLUMN_WIDTH * PIXEL_DENSITY,
    searchParams: { class: "512w" },
  },
  {
    width: (MAX_COLUMN_WIDTH * 2 + COLUMN_GAP) * PIXEL_DENSITY,
    searchParams: { class: "1056w" },
  },
  {
    width: (MAX_COLUMN_WIDTH * 3 + COLUMN_GAP * 2) * PIXEL_DENSITY,
    searchParams: { class: "1600w" },
  },
] as const;

function getImageSrcSet(src: string, variants: ImageVariant[]) {
  return variants
    .map(
      ({ width, searchParams }) =>
        `${setSearchParams(src, searchParams)} ${width}w`,
    )
    .join(", ");
}

function getMaxWidth(columns: number) {
  return columns * MAX_COLUMN_WIDTH + (columns - 1) * COLUMN_GAP;
}

export default function ImageTile({
  id,
  columns,
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

  const srcSet = useMemo(() => getImageSrcSet(imageUrl, VARIANTS), [imageUrl]);

  const sizes = `(max-width: 800px) ${((columns / 3) * 100).toFixed(3)}vw, (min-width: 800px) ${getMaxWidth(columns)}px`;

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
          srcSet={srcSet}
          sizes={sizes}
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

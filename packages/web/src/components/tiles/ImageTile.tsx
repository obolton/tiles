import useEditable from "@/hooks/useEditable";
import { useCallback, useMemo, useState } from "react";
import MovableImage from "@/components/images/MovableImage";
import RichText from "@/components/text/RichText";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import { useEditor } from "@/context/editor";
import { setSearchParams } from "@/utils/urls";
import { serialize } from "@/utils/richText/serialize";
import type { ClientImageTile } from "@/types/tiles";

interface ImageTileProps extends ClientImageTile {
  movable?: boolean;
  hasFocus: boolean;
  onDelete?: () => void;
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
  text,
  originX,
  originY,
  hasFocus,
  onDelete,
}: ImageTileProps) {
  const editor = useEditor();
  const isEditable = useEditable();
  const [origin, setOrigin] = useState({ x: originX, y: originY });

  const onBlur = useCallback(
    async (state: EditorState) => {
      const updatedText = serialize(state);
      await editor.updateImage({
        id,
        text: updatedText,
      });
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

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !event.repeat &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.currentTarget.textContent === ""
      ) {
        onDelete?.();
      }
    },
    [onDelete],
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
        {isEditable ? (
          <TextEditor
            className={styles.text}
            initialValue={text}
            onKeyDownCapture={onDelete ? onKeyDown : undefined}
            onBlur={onBlur}
            showToolbar={hasFocus}
          />
        ) : text ? (
          <RichText className={styles.text} content={text} />
        ) : null}
      </figure>
    </Tile>
  );
}

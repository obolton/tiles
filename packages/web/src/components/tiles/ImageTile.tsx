import MovableImage from "@/components/images/MovableImage";
import RichText from "@/components/text/RichText";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import { setSearchParams } from "@/utils/urls";
import { serialize } from "@/utils/richText/serialize";
import { Computed } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";
import type { ImageProperties } from "@/types/tiles";

interface ImageTileProps extends ImageProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
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
  editor,
  id,
  columns,
  imageUrl,
  text,
  originX,
  originY,
  hasFocus,
  onDelete,
}: ImageTileProps) {
  const { isEditable } = editor;

  const onBlur = async (state: EditorState) => {
    const newText = state.doc.textContent ? serialize(state) : null;
    text.value = newText;

    try {
      await editor.updateImage({
        id,
        text: newText,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const onUpdateOrigin = async (origin: { x: number; y: number }) => {
    try {
      await editor.updateImage({
        id,
        origin,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const element = event.currentTarget as HTMLElement;
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      !event.repeat &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      element.textContent === ""
    ) {
      onDelete?.();
    }
  };

  const srcSet = getImageSrcSet(imageUrl.value, VARIANTS);

  const sizes = `(max-width: 800px) ${((columns.value / 3) * 100).toFixed(3)}vw, (min-width: 800px) ${getMaxWidth(columns.value)}px`;

  const origin = new Computed([originX, originY], (x, y) => ({ x, y }));

  const style = new Computed([originX, originY], (x, y) => ({
    objectPosition: `${x * 100}% ${y * 100}%`,
  }));

  return (
    <Tile border="inside">
      <figure
        id={`${id}-figure`}
        className={styles.figure}
        data-show-in-lightbox="true"
      >
        <MovableImage
          src={imageUrl}
          srcset={srcSet}
          sizes={sizes}
          style={style}
          loading="lazy"
          alt="Image"
          movable={isEditable}
          origin={origin}
          onMove={(newOrigin) => {
            originX.value = newOrigin.x;
            originY.value = newOrigin.y;
          }}
          onRelease={onUpdateOrigin}
        />

        {isEditable.derive((editable) =>
          editable ? (
            <TextEditor
              classList={[styles.caption]}
              initialValue={text.value}
              onBlur={onBlur}
              showToolbar={hasFocus}
              on:keydown={onDelete ? onKeyDown : undefined}
            />
          ) : (
            text.derive((value) =>
              value ? (
                <figcaption classList={["rich-text", styles.caption]}>
                  <RichText content={value} />
                </figcaption>
              ) : null,
            )
          ),
        )}
      </figure>
    </Tile>
  );
}

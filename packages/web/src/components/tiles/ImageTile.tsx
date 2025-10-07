import MovableImage from "@/components/images/MovableImage";
import RichText from "@/components/text/RichText";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import TextEditor from "@/components/inputs/RichTextEditor/TextEditor";
import { setSearchParams } from "@/utils/urls";
import { serialize } from "@/utils/richText/serialize";
import { Computed } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";
import type { ImageProperties } from "@/types/tiles";

export interface ImageTileProps extends ImageProperties {
  editor: Editor;
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
  state,
  id,
  width,
  imageUrl,
  text,
  originX,
  originY,
}: ImageTileProps) {
  const { isEditable } = editor;

  async function onBlur() {
    try {
      const stateValue = state.value;
      const newText = stateValue?.doc.textContent
        ? serialize(stateValue)
        : null;
      text.value = newText;
      await editor.updateImage({
        id,
        text: newText,
      });
    } catch (error) {
      handleError(error);
    }
  }

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
    if (event.key === "Delete" || event.key === "Backspace") {
      event.stopPropagation();
    }
  };

  const srcSet = getImageSrcSet(imageUrl.value, VARIANTS);

  const sizes = `(max-width: 800px) ${((width.value / 3) * 100).toFixed(3)}vw, (min-width: 800px) ${getMaxWidth(width.value)}px`;

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
              state={state}
              classList={[styles.caption]}
              initialValue={text.value}
              on:keydown={onKeyDown}
              on:blur={onBlur}
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

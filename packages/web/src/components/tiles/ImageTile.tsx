import MovableImage from "@/components/images/MovableImage";
import RichText from "@/components/text/RichText";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import { setSearchParams } from "@/utils/urls";
import { serialize } from "@/utils/richText/serialize";
import { Store } from "@/utils/stores";
import type { ClientImageTile } from "@/types/tiles";
import type Editor from "@/editor/Editor";
import type { StoreInterface } from "@/utils/stores";

interface ImageTileProps extends ClientImageTile {
  editor: Editor;
  hasFocus: StoreInterface<boolean>;
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
  const origin = new Store({ x: originX, y: originY });

  const onBlur = async (state: EditorState) => {
    const updatedText = serialize(state);
    await editor.updateImage({
      id,
      text: updatedText,
    });
  };

  const onUpdateOrigin = async (origin: { x: number; y: number }) => {
    await editor.updateImage({
      id,
      origin,
    });
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

  const srcSet = getImageSrcSet(imageUrl, VARIANTS);

  const sizes = `(max-width: 800px) ${((columns / 3) * 100).toFixed(3)}vw, (min-width: 800px) ${getMaxWidth(columns)}px`;

  const style = origin.derive((value) => ({
    objectPosition: `${value.x * 100}% ${value.y * 100}%`,
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
          draggable={!isEditable}
          origin={origin}
          onMove={(newOrigin) => {
            origin.value = newOrigin;
          }}
          onRelease={onUpdateOrigin}
        />
        {isEditable.derive((editable) =>
          editable ? (
            <TextEditor
              classList={[styles.text]}
              initialValue={text}
              onkeydown={onDelete ? onKeyDown : undefined}
              onBlur={onBlur}
              showToolbar={hasFocus}
            />
          ) : text ? (
            <div classList={["rich-text", styles.text]}>
              <RichText content={text} />
            </div>
          ) : null,
        )}
      </figure>
    </Tile>
  );
}

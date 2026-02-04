import ImageToolbar from "@/components/toolbars/images/ImageToolbar";
import MovableImage from "@/components/images/MovableImage";
import RichText from "@/components/text/RichText";
import styles from "./ImageTile.module.css";
import Tile from "./Tile";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import TextEditor from "@/components/inputs/RichTextEditor/TextEditor";
import { setSearchParams } from "@/utils/urls";
import type Image from "@/models/Image";
import { reactive, type Reactive } from "@/utils/reactivity";
import type { EditorView } from "prosemirror-view";

export interface ImageTileProps {
  image: Image;
  showToolbar: Reactive<boolean>;
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

export default function ImageTile({ image, showToolbar }: ImageTileProps) {
  const {
    id,
    width,
    imageUrl,
    text,
    origin,
    state,
    editor: { isEditable },
  } = image;

  if (!imageUrl) {
    return (
      <Tile classList={{ [styles.deleted]: true }}>
        <p>This image has been deleted.</p>
      </Tile>
    );
  }

  const editorView = reactive<EditorView | null>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.stopPropagation();
    }
  };

  const srcSet = getImageSrcSet(imageUrl, VARIANTS);

  const sizes = `(max-width: 800px) ${((width.value / 3) * 100).toFixed(3)}vw, (min-width: 800px) ${getMaxWidth(width.value)}px`;

  const style = origin.derive(({ x, y }) => ({
    objectPosition: `${x * 100}% ${y * 100}%`,
  }));

  return (
    <Tile>
      <If condition={showToolbar}>
        <Portal>
          <ImageToolbar image={image} editorView={editorView} />
        </Portal>
      </If>

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
          onMove={(value) => (origin.value = value)}
          onRelease={(value) => image.setOrigin(value)}
        />

        {isEditable.derive((editable) =>
          editable ? (
            <TextEditor
              editorView={editorView}
              state={state}
              classList={{ [styles.caption]: true }}
              initialValue={text.value}
              on:keydown={onKeyDown}
              on:blur={() => image.persistText()}
            />
          ) : (
            text.derive((value) =>
              value ? (
                <figcaption
                  classList={{ "rich-text": true, [styles.caption]: true }}
                >
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

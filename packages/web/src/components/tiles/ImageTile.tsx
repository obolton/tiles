import ImageToolbar from "@/components/toolbars/images/ImageToolbar";
import ImageView from "@/components/images/ImageView";
import MovableImage from "@/components/images/MovableImage";
import Tile from "./Tile";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import TextEditor from "@/components/inputs/RichTextEditor/TextEditor";
import { getImageSrcSet, getImageStyle, getMaxWidth } from "@/components/images/imageStyle";
import { flag, reactive } from "@/utils/reactivity";
import styles from "@/components/images/ImageView.module.css";
import type Image from "@/models/Image";
import type { Reactive } from "@/utils/reactivity";
import type { EditorView } from "prosemirror-view";

export interface ImageTileProps {
  image: Image;
  showToolbar: Reactive<boolean>;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Delete" || event.key === "Backspace") {
    event.stopPropagation();
  }
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

  const editorView = reactive<EditorView | null>(null);

  if (!imageUrl) {
    return (
      <Tile>
        <ImageView image={image} />
      </Tile>
    );
  }

  const srcSet = getImageSrcSet(imageUrl);
  const style = getImageStyle(image);
  const loaded = flag(false);

  const columns = width.value ?? image.page.width.value;
  const sizes = `(max-width: 800px) ${((columns / 3) * 100).toFixed(3)}vw, (min-width: 800px) ${getMaxWidth(columns)}px`;

  return (
    <Tile>
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <ImageToolbar image={image} editorView={editorView} />
        </Portal>
      </If>

      {isEditable.derive((editable) =>
        editable ? (
          <figure
            id={`${id}-figure`}
            classList={{
              [styles.figure]: true,
              [styles.auto]: image.sizing.derive((s) => s === "AUTO"),
              [styles.loading]: loaded.derive((v) => !v),
            }}
            data-show-in-lightbox="true"
          >
            <MovableImage
              src={imageUrl}
              srcset={srcSet}
              sizes={sizes}
              style={style}
              loading="lazy"
              alt={image.alt}
              movable={isEditable}
              origin={origin}
              onMove={(value) => (origin.value = value)}
              onRelease={(value) => (image.origin.value = value)}
              on:load={loaded.on.bind(loaded)}
            />

            <TextEditor
              editorView={editorView}
              state={state}
              classList={{ [styles.caption]: true }}
              initialValue={text.value}
              on:keydown={onKeyDown}
              on:blur={() => image.persistText()}
            />
          </figure>
        ) : (
          <ImageView image={image} showInLightbox />
        ),
      )}
    </Tile>
  );
}

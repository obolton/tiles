import RichText from "@/components/text/RichText";
import TextToolbar from "@/components/toolbars/text/TextToolbar";
import Tile from "./Tile";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import styles from "./TextTile.module.css";
import TextEditor from "@/components/inputs/RichTextEditor/TextEditor";
import debounce from "@/utils/debounce";
import { combine, reactive, type Reactive } from "@/utils/reactivity";
import type Text from "@/models/Text";
import type { EditorView } from "prosemirror-view";

export interface TextTileProps {
  text: Text;
  showToolbar: Reactive<boolean>;
  autoHeight: boolean;
}

export default function TextTile({
  text,
  showToolbar,
  autoHeight,
}: TextTileProps) {
  const {
    content,
    align,
    state,
    editor: { isEditable },
  } = text;

  const editorView = reactive<EditorView | null>(null);

  const onChange = debounce(() => text.persist(), 1500);

  function onKeyDown(event: KeyboardEvent) {
    const { currentTarget, target, key } = event;

    if (
      event.defaultPrevented ||
      event.repeat ||
      event.shiftKey ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    // Delete the tile if it is empty
    if (
      target === currentTarget &&
      (key === "Delete" || key === "Backspace") &&
      state.value &&
      state.value.doc.childCount <= 1 &&
      state.value.doc.textContent === ""
    ) {
      event.preventDefault();
      text.delete();
    }

    // Prevent ancestors from acting on keyboard navigation
    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "Home" ||
      key === "End"
    ) {
      event.stopPropagation();
    }
  }

  const classList = combine({ align, isEditable }, ({ align, isEditable }) => ({
    "rich-text": true,
    [styles.text]: true,
    [styles.editor]: isEditable,
    [styles["align-top"]]: align === "TOP",
    [styles["align-center"]]: align === "CENTER",
    [styles["align-bottom"]]: align === "BOTTOM",
  }));

  const contents = isEditable.derive((value) =>
    value ? (
      <TextEditor
        editorView={editorView}
        state={state}
        classList={classList}
        initialValue={content.value}
        tabindex={-1}
        onChange={onChange}
        on:keydown={onKeyDown}
      />
    ) : (
      <div classList={classList}>
        {content.derive((value) => (
          <RichText content={value} />
        ))}
      </div>
    ),
  );

  return (
    <Tile>
      <If condition={showToolbar}>
        <Portal>
          <TextToolbar
            text={text}
            editorView={editorView}
            autoHeight={autoHeight}
          />
        </Portal>
      </If>

      {autoHeight ? (
        contents
      ) : (
        <pop-out className={styles["pop-out"]}>{contents}</pop-out>
      )}
    </Tile>
  );
}

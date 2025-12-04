import RichText from "@/components/text/RichText";
import TextToolbar from "@/components/toolbars/text/TextToolbar";
import Tile from "./Tile";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import styles from "./TextTile.module.css";
import TextEditor from "@/components/inputs/RichTextEditor/TextEditor";
import debounce from "@/utils/debounce";
import { reactive, type Reactive } from "@/utils/reactivity";
import type Text from "@/models/Text";
import type { EditorView } from "prosemirror-view";

export interface TextTileProps {
  text: Text;
  hasFocus: Reactive<boolean>;
}

export default function TextTile({ text, hasFocus }: TextTileProps) {
  const {
    block,
    content,
    textColor,
    align,
    background,
    animation,
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

  const alignClass = align.derive((value) => {
    switch (value) {
      default:
      case "TOP":
        return styles["align-top"];
      case "CENTER":
        return styles["align-center"];
      case "BOTTOM":
        return styles["align-bottom"];
    }
  });

  const contents = isEditable.derive((value) =>
    value ? (
      <TextEditor
        editorView={editorView}
        state={state}
        classList={[styles.text, styles.editor, alignClass]}
        initialValue={content.value}
        tabindex={-1}
        onChange={onChange}
        on:keydown={onKeyDown}
      />
    ) : (
      <div classList={["rich-text", styles.text, alignClass]}>
        {content.derive((value) => (
          <RichText content={value} />
        ))}
      </div>
    ),
  );

  return (
    <Tile
      textColor={textColor}
      background={background}
      animation={animation}
      border={background.derive((value) => (value ? "outside" : "none"))}
    >
      <If condition={hasFocus}>
        <Portal>
          <TextToolbar text={text} editorView={editorView} />
        </Portal>
      </If>

      {block.derive((value) =>
        value ? (
          contents
        ) : (
          <pop-out className={styles["pop-out"]}>{contents}</pop-out>
        ),
      )}
    </Tile>
  );
}

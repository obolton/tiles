import TextToolbar from "@/components/toolbars/text/TextToolbar";
import TextView from "@/components/text/TextView";
import Tile from "./Tile";
import If from "jsx/if";
import Portal from "jsx/portal";
import styles from "./TextTile.module.css";
import textViewStyles from "@/components/text/TextView.module.css";
import CollaborativeTextEditor from "@/components/inputs/RichTextEditor/CollaborativeTextEditor";
import { combine, reactive, type Reactive } from "reactivity";
import type Text from "@/models/Text";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export interface TextTileProps {
  text: Text;
  showToolbar: Reactive<boolean>;
}

export default function TextTile({ text, showToolbar }: TextTileProps) {
  const {
    align,
    editor: { isEditable, isCollaborating },
  } = text;

  const editorView = reactive<EditorView | null>(null);
  const state = reactive<EditorState | null>(null);

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
      void text.delete();
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

  const editorClassList = combine({ align }, ({ align }) => ({
    "rich-text": true,
    [textViewStyles.text]: true,
    [styles.editor]: true,
    [textViewStyles["align-top"]]: align === "TOP",
    [textViewStyles["align-center"]]: align === "CENTER",
    [textViewStyles["align-bottom"]]: align === "BOTTOM",
  }));

  // Editing waits for the collaboration session, which starts right after edit mode
  const contents = combine({ isEditable, isCollaborating }, ({ isEditable }) => {
    if (!isEditable) {
      return <TextView text={text} />;
    }

    const awareness = text.page.awareness;
    if (!awareness) {
      return null;
    }

    return (
      <CollaborativeTextEditor
        contentFragment={text.contentFragment}
        awareness={awareness}
        undoManager={text.editor.undoManager?.manager}
        editorView={editorView}
        classList={editorClassList}
        aria-label="Text"
        tabindex={-1}
        onChange={(newState) => (state.value = newState)}
        on:keydown={onKeyDown}
      />
    );
  });

  return (
    <Tile>
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <TextToolbar text={text} state={state} editorView={editorView} />
        </Portal>
      </If>

      {contents}
    </Tile>
  );
}

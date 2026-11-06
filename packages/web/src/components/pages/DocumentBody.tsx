import EmbeddedTile from "@/components/item/EmbeddedTile";
import RichText from "@/components/text/RichText";
import CollaborativeTextEditor from "@/components/inputs/RichTextEditor/CollaborativeTextEditor";
import { serializeFragment } from "@/utils/richText/serialize";
import { combine } from "reactivity";
import styles from "./DocumentBody.module.css";
import type Body from "@/models/Body";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Reactive } from "reactivity";

export interface DocumentBodyProps {
  body: Body;
  editorView: Reactive<EditorView | null>;
  state: Reactive<EditorState | null>;
  signal?: AbortSignal;
}

export default function DocumentBody({ body, editorView, state, signal }: DocumentBodyProps) {
  const { page } = body;
  const { editor } = page;
  if (!editor) {
    throw new Error("Requires editor context");
  }
  const { isEditable, isCollaborating } = editor;

  function renderTile(id: string) {
    const tile = page.index.get(id);
    return tile ? <EmbeddedTile tile={tile} /> : null;
  }

  // Editing waits for the collaboration session, which starts right after edit mode
  const contents = combine({ isEditable, isCollaborating }, ({ isEditable }) => {
    if (!isEditable) {
      return (
        <div className="rich-text">
          <RichText content={serializeFragment(body.fragment)} renderTile={renderTile} />
        </div>
      );
    }

    const awareness = page.awareness;
    if (!awareness) {
      return null;
    }

    return (
      <CollaborativeTextEditor
        contentFragment={body.fragment}
        awareness={awareness}
        undoManager={editor.undoManager?.manager}
        editorView={editorView}
        body={body}
        classList={{ "rich-text": true, [styles.editor]: true }}
        aria-label="Document"
        onChange={(newState) => (state.value = newState)}
        signal={signal}
      />
    );
  });

  return (
    <div className={styles.body} data-body>
      {contents}
    </div>
  );
}

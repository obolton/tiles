import If from "jsx/if";
import Portal from "jsx/portal";
import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import RichText from "@/components/text/RichText";
import CollaborativeTextEditor from "@/components/inputs/RichTextEditor/CollaborativeTextEditor";
import DocumentToolbar from "@/components/toolbars/pages/DocumentToolbar";
import { serializeFragment } from "@/utils/richText/serialize";
import { combine, reactive } from "reactivity";
import styles from "./DocumentBody.module.css";
import embedStyles from "@/utils/richText/tiles/tiles.module.css";
import type Body from "@/models/Body";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export interface DocumentBodyProps {
  body: Body;
  signal?: AbortSignal;
}

/**
 * The rich text body of a document page, with its tiles embedded in the text. Editing uses a
 * collaborative editor that renders embedded tiles with node views; viewing renders a snapshot.
 */
export default function DocumentBody({ body, signal }: DocumentBodyProps) {
  const { page } = body;
  const { editor } = page;
  if (!editor) {
    throw new Error("Requires editor context");
  }
  const { isEditable, isCollaborating, selection } = editor;

  const editorView = reactive<EditorView | null>(null);
  const state = reactive<EditorState | null>(null);

  // The document toolbar stands in for the page toolbar while nothing is selected
  const showToolbar = combine(
    { isEditable, selection },
    ({ isEditable, selection }) => isEditable && selection.size === 0,
  );

  function renderTile(id: string) {
    const tile = page.index.get(id);
    if (!tile) {
      return null;
    }
    return (
      <div className={embedStyles.embed}>
        <Item tile={tile} draggable={false}>
          <TileContent tile={tile} />
        </Item>
      </div>
    );
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
      <If condition={showToolbar}>
        <Portal element="toolbar-slot">
          <DocumentToolbar page={page} state={state} editorView={editorView} />
        </Portal>
      </If>

      {contents}
    </div>
  );
}

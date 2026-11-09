import If from "jsx/if";
import Portal from "jsx/portal";
import InsertButton from "@/components/buttons/InsertButton";
import DocumentInsertMenu from "@/components/toolbars/insert/DocumentInsertMenu";
import DocumentToolbar from "@/components/toolbars/pages/DocumentToolbar";
import DocumentBody from "@/components/pages/DocumentBody";
import EditorLayout from "@/components/pages/EditorLayout";
import { reactive, type Reactive } from "reactivity";
import styles from "./DocumentPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { JSX } from "jsx/jsx";

export interface DocumentPageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  showToolbar: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
  end?: JSX.Node;
  endVisible?: Reactive<boolean>;
  bar?: JSX.Node;
}

export default function DocumentPage({
  page,
  isEditable,
  showToolbar,
  signal,
  end,
  endVisible,
  bar,
}: DocumentPageProps) {
  const editorView = reactive<EditorView | null>(null);
  const state = reactive<EditorState | null>(null);

  return (
    <EditorLayout end={end} endVisible={endVisible} bar={bar}>
      <main
        className={styles.main}
        style={{ "--page-width": page.width }}
        data-alignment={page.alignment}
        data-layout="VERTICAL"
        data-page-type="DOCUMENT"
      >
        {page.body ? (
          <DocumentBody body={page.body} editorView={editorView} state={state} signal={signal} />
        ) : null}

        <If condition={isEditable}>
          <Portal element="insert-slot">
            <InsertButton id="insert-button" popovertarget="insert-menu" />
            <DocumentInsertMenu id="insert-menu" align="auto" />
          </Portal>
        </If>

        <If condition={showToolbar}>
          <Portal element="toolbar-slot">
            <DocumentToolbar page={page} state={state} editorView={editorView} />
          </Portal>
        </If>
      </main>
    </EditorLayout>
  );
}

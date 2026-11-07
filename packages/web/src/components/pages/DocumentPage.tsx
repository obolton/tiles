import If from "jsx/if";
import Portal from "jsx/portal";
import InsertButton from "@/components/buttons/InsertButton";
import DocumentInsertMenu from "@/components/toolbars/insert/DocumentInsertMenu";
import DocumentToolbar from "@/components/toolbars/pages/DocumentToolbar";
import DocumentBody from "@/components/pages/DocumentBody";
import EditorLayout from "@/components/pages/EditorLayout";
import { focusNear } from "@/utils/richText/navigation";
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
}

export default function DocumentPage({
  page,
  isEditable,
  showToolbar,
  signal,
  end,
  endVisible,
}: DocumentPageProps) {
  const editorView = reactive<EditorView | null>(null);
  const state = reactive<EditorState | null>(null);

  // Clicking the page around the body puts the caret at the nearest position, so the body can be
  // focused when it does not fill the viewport. A drag that selected text is left alone.
  function onClick(event: MouseEvent) {
    const view = editorView.value;
    if (
      !view ||
      !(event.target instanceof Node) ||
      view.dom.contains(event.target) ||
      getSelection()?.isCollapsed === false
    ) {
      return;
    }
    page.editor?.clearSelection();
    focusNear(view, { x: event.clientX, y: event.clientY });
  }

  return (
    <EditorLayout end={end} endVisible={endVisible}>
      <main
        className={styles.main}
        style={{ "--page-width": page.width }}
        data-alignment={page.alignment}
        data-layout="VERTICAL"
        data-page-type="DOCUMENT"
        on:click={onClick}
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

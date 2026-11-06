import If from "jsx/if";
import Portal from "jsx/portal";
import InsertButton from "@/components/buttons/InsertButton";
import DocumentInsertMenu from "@/components/toolbars/insert/DocumentInsertMenu";
import DocumentBody from "@/components/pages/DocumentBody";
import EditorLayout from "@/components/pages/EditorLayout";
import styles from "./DocumentPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export interface DocumentPageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
  end?: JSX.Node;
  endVisible?: Reactive<boolean>;
}

export default function DocumentPage({
  page,
  isEditable,
  signal,
  end,
  endVisible,
}: DocumentPageProps) {
  return (
    <EditorLayout end={end} endVisible={endVisible}>
      <main
        className={styles.main}
        style={{ "--page-width": page.width }}
        data-alignment={page.alignment}
        data-layout="VERTICAL"
        data-page-type="DOCUMENT"
      >
        {page.body ? <DocumentBody body={page.body} signal={signal} /> : null}

        <If condition={isEditable}>
          <Portal element="insert-slot">
            <InsertButton id="insert-button" popovertarget="insert-menu" />
            <DocumentInsertMenu id="insert-menu" align="auto" />
          </Portal>
        </If>
      </main>
    </EditorLayout>
  );
}

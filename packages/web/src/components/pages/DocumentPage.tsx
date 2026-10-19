import Each from "@/jsx/each";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import InsertButton from "@/components/buttons/InsertButton";
import DocumentInsertMenu from "@/components/toolbars/insert/DocumentInsertMenu";
import EditorLayout from "@/components/pages/EditorLayout";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./DocumentPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "reactivity";
import type { JSX } from "@/jsx/jsx";

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
  tiles,
  signal,
  end,
  endVisible,
}: DocumentPageProps) {
  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));

  function ref(element: HTMLElement) {
    LayoutEditor.attach({
      element,
      grid: element,
      layoutType: "VERTICAL",
      dropTarget: element,
      page,
      sectionId: null,
      signal,
    });
  }

  return (
    <EditorLayout end={end} endVisible={endVisible}>
      <main
        ref={ref}
        className={styles.main}
        style={{ "--page-width": page.width }}
        data-alignment={page.alignment}
        data-layout="VERTICAL"
        data-page-type="DOCUMENT"
      >
        <Each items={tiles}>
          {(tile) => (
            <Item tile={tile} tabindex={tabindex} draggable={false}>
              <TileContent tile={tile} />
            </Item>
          )}
        </Each>

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

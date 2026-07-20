import Each from "@/jsx/each";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import InsertButton from "@/components/buttons/InsertButton";
import DocumentInsertMenu from "@/components/toolbars/insert/DocumentInsertMenu";
import EditorLayout from "@/components/pages/EditorLayout";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./CollectionPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import { reactive, type Reactive } from "@/utils/reactivity";

export interface CollectionPageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
}

export default function CollectionPage({ page, isEditable, tiles, signal }: CollectionPageProps) {
  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));
  const resize = reactive("e se s");

  function ref(element: HTMLElement) {
    LayoutEditor.attach({
      element,
      grid: element,
      layoutType: "GRID",
      dropTarget: element,
      page,
      sectionId: null,
      signal,
    });
  }

  return (
    <EditorLayout>
      <main
        ref={ref}
        className={styles.main}
        style={{ "--page-width": page.width }}
        data-alignment={page.alignment}
        data-layout="GRID"
        data-page-type="COLLECTION"
      >
        <Each items={tiles}>
          {(tile) => (
            <Item tile={tile} tabindex={tabindex} resize={resize}>
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

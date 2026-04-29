import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./DocumentPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "@/utils/reactivity";

export interface DocumentPageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
}

export default function DocumentPage({
  page,
  isEditable,
  tiles,
  signal,
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
    <main
      ref={ref}
      className={styles.main}
      style={{ "--width": page.width }}
      data-alignment={page.alignment}
      data-layout="VERTICAL"
      data-page-type="DOCUMENT"
    >
      <Each items={tiles}>
        {(tile) => <Item tile={tile} tabindex={tabindex} draggable={false} />}
      </Each>
    </main>
  );
}

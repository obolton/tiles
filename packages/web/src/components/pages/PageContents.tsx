import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./PageContents.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "@/utils/reactivity";

export interface PageContentsProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
}

export default function PageContents({
  page,
  isEditable,
  tiles,
  signal,
}: PageContentsProps) {
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
    <main ref={ref} className={styles.main} data-layout="VERTICAL">
      <Each items={tiles}>
        {(tile) => (
          <Item
            editable={isEditable}
            tile={tile}
            tabindex={tabindex}
            resize={tile.dimensions.derive((value) => {
              if (value !== "CUSTOM") {
                return null;
              }
              return tile.type === "TEXT" ? "horizontal" : "all";
            })}
            autoHeight={tile.type === "TEXT"}
            showInsertButton
          />
        )}
      </Each>
    </main>
  );
}

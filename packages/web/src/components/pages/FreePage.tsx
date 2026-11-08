import Each from "jsx/each";
import If from "jsx/if";
import Portal from "jsx/portal";
import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import InsertButton from "@/components/buttons/InsertButton";
import PageToolbar from "@/components/toolbars/pages/PageToolbar";
import DocumentInsertMenu from "@/components/toolbars/insert/DocumentInsertMenu";
import DockZone from "@/components/docks/DockZone";
import EditorLayout from "@/components/pages/EditorLayout";
import LayoutEditor from "@/editor/LayoutEditor";
import styles from "./FreePage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export interface FreePageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  showToolbar: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
  end?: Reactive<JSX.Node>;
}

export default function FreePage({
  page,
  isEditable,
  showToolbar,
  tiles,
  signal,
  end,
}: FreePageProps) {
  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));
  const resize = page.alignment.derive((alignment) => {
    switch (alignment) {
      case "LEFT":
        return "e se s";
      case "RIGHT":
        return "w sw s";
      default:
        return "w e sw se s";
    }
  });
  const { dockedTiles, dockSizes } = page;
  const style = {
    "--dock-top-size": dockSizes.TOP.derive((size) => `${size}px`),
    "--dock-bottom-size": dockSizes.BOTTOM.derive((size) => `${size}px`),
    "--dock-left-size": dockSizes.LEFT.derive((size) => `${size}px`),
    "--dock-right-size": dockSizes.RIGHT.derive((size) => `${size}px`),
    "--page-width": page.width,
  };

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
    <EditorLayout end={end}>
      <div className={styles.layout} style={style}>
        <DockZone
          page={page}
          isEditable={isEditable}
          edge="TOP"
          tiles={dockedTiles.TOP}
          signal={signal}
        />
        <DockZone
          page={page}
          isEditable={isEditable}
          edge="LEFT"
          tiles={dockedTiles.LEFT}
          signal={signal}
        />
        <main
          ref={ref}
          className={styles.main}
          data-alignment={page.alignment}
          data-layout="VERTICAL"
          data-page-type="FREE"
        >
          <Each items={tiles}>
            {(tile) => (
              <Item tile={tile} tabindex={tabindex} resize={resize}>
                <TileContent tile={tile} />
              </Item>
            )}
          </Each>
        </main>
        <DockZone
          page={page}
          isEditable={isEditable}
          edge="RIGHT"
          tiles={dockedTiles.RIGHT}
          signal={signal}
        />
        <DockZone
          page={page}
          isEditable={isEditable}
          edge="BOTTOM"
          tiles={dockedTiles.BOTTOM}
          signal={signal}
        />

        <If condition={isEditable}>
          <Portal element="insert-slot">
            <InsertButton id="insert-button" popovertarget="insert-menu" />
            <DocumentInsertMenu id="insert-menu" align="auto" />
          </Portal>
        </If>

        <If condition={showToolbar}>
          <Portal element="toolbar-slot">
            <PageToolbar page={page} />
          </Portal>
        </If>
      </div>
    </EditorLayout>
  );
}

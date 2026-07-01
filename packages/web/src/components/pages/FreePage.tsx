import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import DockZone from "@/components/docks/DockZone";
import LayoutEditor from "@/editor/LayoutEditor";
import { combine } from "@/utils/reactivity";
import styles from "./FreePage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "@/utils/reactivity";

export interface FreePageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
}

export default function FreePage({
  page,
  isEditable,
  tiles,
  signal,
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
  const { dockedTiles } = page;
  const style = combine(page.dockSizes, (sizes) => ({
    "--dock-top-size": `${sizes.TOP}px`,
    "--dock-bottom-size": `${sizes.BOTTOM}px`,
    "--dock-left-size": `${sizes.LEFT}px`,
    "--dock-right-size": `${sizes.RIGHT}px`,
  }));

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
        style={{ "--width": page.width }}
        data-alignment={page.alignment}
        data-layout="VERTICAL"
        data-page-type="FREE"
      >
        <Each items={tiles}>
          {(tile) => <Item tile={tile} tabindex={tabindex} resize={resize} />}
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
    </div>
  );
}

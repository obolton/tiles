import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import FilmstripPanel from "@/components/filmstrip/FilmstripPanel";
import { persistent, reactive } from "@/utils/reactivity";
import styles from "./PresentationPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "@/utils/reactivity";

const DEFAULT_SIDEBAR_WIDTH = 200;

export interface PresentationPageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
}

export default function PresentationPage({
  page,
  isEditable,
  tiles,
  signal,
}: PresentationPageProps) {
  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));

  const storedWidth = persistent<number>(
    "filmstrip:width",
    DEFAULT_SIDEBAR_WIDTH,
  );
  const width = reactive(storedWidth.value);
  const style = width.derive((value) => ({ "--sidebar-width": `${value}px` }));

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
      <FilmstripPanel
        page={page}
        isEditable={isEditable}
        tiles={tiles}
        size={width}
        on:panelresize={(event) => (width.value = event.size)}
        on:panelresizeend={(event) => (storedWidth.value = event.size)}
      />
      <main
        ref={ref}
        className={styles.main}
        style={{ "--width": page.width }}
        data-alignment={page.alignment}
        data-layout="VERTICAL"
        data-page-type="PRESENTATION"
      >
        <Each items={tiles}>
          {(tile) => <Item tile={tile} tabindex={tabindex} draggable={false} />}
        </Each>
      </main>
    </div>
  );
}

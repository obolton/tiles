import Each from "@/jsx/each";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import FilmstripPanel from "@/components/filmstrip/FilmstripPanel";
import styles from "./PresentationPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "@/utils/reactivity";

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
    <>
      <FilmstripPanel page={page} isEditable={isEditable} tiles={tiles} />
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
    </>
  );
}

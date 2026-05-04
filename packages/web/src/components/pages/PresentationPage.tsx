import Each from "@/jsx/each";
import If from "@/jsx/if";
import Item from "@/components/item/Item";
import LayoutEditor from "@/editor/LayoutEditor";
import Section from "@/models/Section";
import FilmstripPanel from "@/components/filmstrip/FilmstripPanel";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
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

  function addSlide() {
    Section.create(page, {
      beforeId: null,
      layout: "FREEFORM",
      sizing: "LANDSCAPE",
    }).catch(handleError);
  }

  return (
    <>
      <FilmstripPanel tiles={tiles} />
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
        <If condition={isEditable}>
          <button
            className="floating"
            type="button"
            aria-label="Add slide"
            data-tooltip="Add slide"
            on:click={addSlide}
          >
            <NewIcon aria-hidden="true" />
          </button>
        </If>
      </main>
    </>
  );
}

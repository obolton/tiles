import Each from "@/jsx/each";
import If from "@/jsx/if";
import Portal from "@/jsx/portal";
import Slide from "@/components/slides/Slide";
import FilmstripPanel from "@/components/filmstrip/FilmstripPanel";
import InsertButton from "@/components/buttons/InsertButton";
import PresentationInsertMenu from "@/components/toolbars/insert/PresentationInsertMenu";
import Section from "@/models/Section";
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
  const resize = isEditable.derive((editable) => (editable ? "all" : null));

  const storedWidth = persistent<number>("filmstrip:width", DEFAULT_SIDEBAR_WIDTH);
  const width = reactive(storedWidth.value);
  const style = {
    "--sidebar-width": width.derive((value) => `${value}px`),
    "--page-width": page.width,
  };

  function getInsertionParent(): string {
    const section = page.editor?.activeSection;
    if (!section) {
      throw new Error("A slide must be selected to insert content");
    }
    return section.id;
  }

  // Center a partially visible slide when clicked, so the viewport (and
  // through it the filmstrip and selection) follows the slide being edited
  function onClick(event: MouseEvent) {
    if (!isEditable.value || !(event.target instanceof Element)) {
      return;
    }
    const slide = event.target.closest("main > page-item");
    slide?.scrollIntoView({ behavior: "smooth", block: "center" });
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
        className={styles.main}
        data-alignment={page.alignment}
        data-page-type="PRESENTATION"
        on:click={onClick}
      >
        <Each items={tiles}>
          {(tile) => {
            if (!(tile instanceof Section)) {
              if (import.meta.env.DEV) {
                console.warn(`Presentation pages only render sections; skipping ${tile.type} tile`);
              }
              return null;
            }
            return <Slide section={tile} tabindex={tabindex} resize={resize} signal={signal} />;
          }}
        </Each>
      </main>

      <If condition={isEditable}>
        <Portal element="insert-slot">
          <InsertButton id="insert-button" popovertarget="insert-menu" />
          <PresentationInsertMenu id="insert-menu" align="auto" getParentId={getInsertionParent} />
        </Portal>
      </If>
    </div>
  );
}

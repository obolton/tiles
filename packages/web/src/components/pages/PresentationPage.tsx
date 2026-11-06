import Each from "jsx/each";
import If from "jsx/if";
import Portal from "jsx/portal";
import Slide from "@/components/slides/Slide";
import EditorLayout from "@/components/pages/EditorLayout";
import ThumbnailListPanel from "@/components/thumbnails/ThumbnailListPanel";
import InsertButton from "@/components/buttons/InsertButton";
import PresentationInsertMenu from "@/components/toolbars/insert/PresentationInsertMenu";
import Section from "@/models/Section";
import styles from "./PresentationPage.module.css";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "reactivity";
import type { JSX } from "jsx/jsx";

export interface PresentationPageProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
  signal?: AbortSignal;
  end?: JSX.Node;
  endVisible?: Reactive<boolean>;
}

export default function PresentationPage({
  page,
  isEditable,
  tiles,
  signal,
  end,
  endVisible,
}: PresentationPageProps) {
  const tabindex = isEditable.derive((editable) => (editable ? 0 : undefined));
  const resize = isEditable.derive((editable) => (editable ? "all" : null));

  function getInsertionPlacement() {
    const section = page.editor?.activeSection;
    if (!section) {
      throw new Error("A slide must be selected to insert content");
    }
    return { parentId: section.id, beforeId: null };
  }

  // Center a partially visible slide when clicked, so the viewport (and
  // through it the thumbnail list and selection) follows the slide being edited
  function onClick(event: MouseEvent) {
    if (!isEditable.value || !(event.target instanceof Element)) {
      return;
    }
    const slide = event.target.closest("main > page-item");
    slide?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <EditorLayout
      start={<ThumbnailListPanel page={page} isEditable={isEditable} tiles={tiles} />}
      end={end}
      endVisible={endVisible}
    >
      <main
        className={styles.main}
        style={{ "--page-width": page.width }}
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

        <If condition={isEditable}>
          <Portal element="insert-slot">
            <InsertButton id="insert-button" popovertarget="insert-menu" />
            <PresentationInsertMenu
              id="insert-menu"
              align="auto"
              getPlacement={getInsertionPlacement}
            />
          </Portal>
        </If>
      </main>
    </EditorLayout>
  );
}

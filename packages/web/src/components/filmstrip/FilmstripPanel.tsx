import Each from "@/jsx/each";
import If from "@/jsx/if";
import Section from "@/models/Section";
import FilmstripThumbnail from "./FilmstripThumbnail";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import styles from "./FilmstripPanel.module.css";
import type { DragDropEvent } from "@/utils/drag";
import type { FilmstripEvent } from "@/elements/filmstrip/events";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "@/utils/reactivity";

export interface FilmstripPanelProps {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
}

export default function FilmstripPanel({
  page,
  isEditable,
  tiles,
}: FilmstripPanelProps) {
  function onSlideSelect(event: FilmstripEvent) {
    page.editor?.select([event.slideId]);
  }

  function onSlideReorder(event: FilmstripEvent) {
    if (!isEditable.value) {
      return;
    }
    const tile = page.getTile(event.slideId);
    tile.move({ parentId: null, beforeId: event.beforeId });
  }

  function onDragStart(event: DragDropEvent) {
    if (!(event.target instanceof Element)) {
      return;
    }
    const thumb = event.target.closest<HTMLElement>('[role="option"]');
    if (!thumb) {
      return;
    }
    const slideId = thumb.getAttribute("aria-controls");
    if (!slideId) {
      return;
    }
    event.state.data = { tile: page.getTile(slideId) };
  }

  function addSlide() {
    Section.create(page, {
      beforeId: null,
      layout: "FREEFORM",
      sizing: "LANDSCAPE",
    }).catch(handleError);
  }

  return (
    <aside
      classList={{ [styles.panel]: true, "filmstrip-panel": true }}
      aria-label="Filmstrip"
    >
      <filmstrip-view
        className={styles.rail}
        aria-label="Slide navigator"
        allowdrag={isEditable}
        on:slideselect={onSlideSelect}
        on:slidereorder={onSlideReorder}
        on:dnd-dragstart={onDragStart}
      >
        <Each items={tiles}>
          {(tile) => <FilmstripThumbnail tile={tile} />}
        </Each>
      </filmstrip-view>

      <If condition={isEditable}>
        <button
          classList={{ floating: true, [styles["add-slide"]]: true }}
          type="button"
          aria-label="Add slide"
          data-tooltip="Add slide"
          on:click={addSlide}
        >
          <NewIcon aria-hidden="true" />
        </button>
      </If>
    </aside>
  );
}

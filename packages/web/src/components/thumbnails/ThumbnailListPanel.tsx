import Each from "jsx/each";
import If from "jsx/if";
import Section from "@/models/Section";
import SlideThumbnail from "@/components/slides/SlideThumbnail";
import { SIDEBAR_CONSTRAINTS } from "@/components/pages/EditorLayout";
import NewIcon from "@/icons/new.svg?jsx";
import { handleError } from "@/utils/errors";
import styles from "./ThumbnailListPanel.module.css";
import type { DragDropEvent } from "@/utils/drag";
import type { ThumbnailListEvent } from "@/elements/thumbnails/events";
import type { JSX } from "jsx/jsx";
import type Page from "@/models/Page";
import type TileCollection from "@/models/TileCollection";
import type { Reactive } from "carillon";

export interface ThumbnailListPanelProps extends JSX.Attributes<"resizable-panel"> {
  page: Page;
  isEditable: Reactive<boolean>;
  tiles: TileCollection;
}

export default function ThumbnailListPanel({
  page,
  isEditable,
  tiles,
  classList,
  ...props
}: ThumbnailListPanelProps) {
  function onSlideSelect(event: ThumbnailListEvent) {
    if (!isEditable.value) {
      return;
    }
    // Maintain the selection when it is within the selected slide
    if (page.editor?.activeSection?.id === event.slideId) {
      return;
    }
    page.editor?.select([event.slideId]);
  }

  function onSlideReorder(event: ThumbnailListEvent) {
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
    <resizable-panel
      classList={{
        [styles.panel]: true,
        "thumbnail-list-panel": true,
        ...classList,
      }}
      role="complementary"
      aria-label="Thumbnails"
      edge="inline-start"
      min={SIDEBAR_CONSTRAINTS.min}
      max={SIDEBAR_CONSTRAINTS.max}
      {...props}
    >
      <thumbnail-list
        className={styles.rail}
        aria-label="Slide navigator"
        allowdrag={isEditable}
        on:slideselect={onSlideSelect}
        on:slidereorder={onSlideReorder}
        on:dnd-dragstart={onDragStart}
      >
        <Each items={tiles}>
          {(tile) => (tile instanceof Section ? <SlideThumbnail section={tile} /> : null)}
        </Each>
      </thumbnail-list>

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
    </resizable-panel>
  );
}

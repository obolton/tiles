import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import CalendarEditor from "@/editor/CalendarEditor";
import Text from "@/models/Text";
import Image from "@/models/Image";
import Link from "@/models/Link";
import Video from "@/models/Video";
import PageLink from "@/models/PageLink";
import { getNearestMonth } from "@/utils/dates";
import { fragmentToPlainText, toPlainText } from "@/utils/richText/plainText";
import { getBackgroundStyle } from "@/utils/backgrounds";
import { getThemeStyles } from "@/utils/themes";
import { handleError } from "@/utils/errors";
import { reactive, combine } from "@/utils/reactivity";
import Each from "@/jsx/each";
import styles from "./CalendarSection.module.css";
import type CalendarGrid from "@/elements/calendar-grid/CalendarGrid";
import type { CalendarEvent } from "@/elements/calendar-grid/events";
import type Tile from "@/models/Tile";
import type SectionModel from "@/models/Section";
import type { Reactive } from "@/utils/reactivity";

function getSegmentTextColor(tile: Tile): Reactive<string | null> {
  return combine(
    { textColor: tile.textColor, theme: tile.theme },
    ({ textColor, theme }) => getThemeStyles(theme, { textColor })["--text-color"] ?? null,
  );
}

function getSegmentBackground(tile: Tile): Reactive<string | null> {
  if (tile instanceof Image && tile.imageUrl) {
    return reactive(`url(${tile.imageUrl}) center / cover`);
  }
  return tile.background.derive((bg) => getBackgroundStyle(bg)?.background ?? null);
}

function getSegmentLabel(tile: Tile): Reactive<string | null> {
  if (tile instanceof Text) {
    // TODO: react to Y.XmlFragment changes; currently a snapshot at mount time.
    const text = fragmentToPlainText(tile.contentFragment).split("\n")[0]?.trim();
    return reactive(text || null);
  }
  if (tile instanceof Link) {
    return tile.title;
  }
  if (tile instanceof Video) {
    return tile.title;
  }
  if (tile instanceof PageLink) {
    return tile.linkedPage.derive((page) => page?.title ?? null);
  }
  if (tile instanceof Image) {
    return tile.text.derive((text) => {
      if (!text) {
        return null;
      }
      const plain = toPlainText(text).split("\n")[0]?.trim();
      return plain || null;
    });
  }
  return reactive(null);
}

export interface CalendarSectionProps {
  section: SectionModel;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<string | null>;
  signal?: AbortSignal;
}

export default function CalendarSection({
  section,
  tabindex,
  resize,
  signal,
}: CalendarSectionProps) {
  const { tiles, editor } = section;
  const { isEditable } = editor;

  const startDates = tiles.value.flatMap((tile) =>
    tile.startDate.value ? [new Date(tile.startDate.value)] : [],
  );
  const initialMonth = getNearestMonth(startDates);

  function ref(element: CalendarGrid) {
    CalendarEditor.attach({
      element,
      page: editor.page,
      sectionId: section.id,
      signal,
    });
  }

  function handleCellSelect(event: CalendarEvent) {
    if (!isEditable.value) {
      return;
    }
    Text.create(editor.page, {
      parentId: section.id,
      beforeId: null,
      sizing: "AUTO",
      startDate: event.start,
      endDate: event.end,
    }).catch(handleError);
  }

  return (
    <calendar-grid
      ref={ref}
      classList={{ [styles.calendar]: true }}
      data-section-id={section.id}
      data-layout="CALENDAR"
      tabindex={tabindex}
      editable={isEditable}
      year={initialMonth.year}
      month={initialMonth.month + 1}
      on:calendarcellselect={handleCellSelect}
    >
      <Each items={tiles}>
        {(tile) => (
          <calendar-date
            start={tile.startDate}
            end={tile.endDate}
            style={{
              "--segment-background": getSegmentBackground(tile),
              color: getSegmentTextColor(tile),
            }}
            label={getSegmentLabel(tile)}
          >
            <Item tile={tile} tabindex={tabindex} resize={resize}>
              <TileContent tile={tile} />
            </Item>
          </calendar-date>
        )}
      </Each>
    </calendar-grid>
  );
}

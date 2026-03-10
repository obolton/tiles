import Item from "@/components/item/Item";
import CalendarEditor from "@/editor/CalendarEditor";
import Text from "@/models/Text";
import { toISODate } from "@/utils/dates";
import { handleError } from "@/utils/errors";
import Each from "@/jsx/each";
import styles from "./CalendarSection.module.css";
import type CalendarGrid from "@/elements/calendar-grid/CalendarGrid";
import type { CalendarGridEvent } from "@/elements/calendar-grid/events";
import type SectionModel from "@/models/Section";
import type { ResizeDirection } from "@/elements/item/PageItem";
import type { Reactive } from "@/utils/reactivity";

export interface CalendarSectionProps {
  section: SectionModel;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<ResizeDirection | null>;
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

  function ref(element: CalendarGrid) {
    CalendarEditor.attach({
      element,
      page: editor.page,
      sectionId: section.id,
      signal,
    });
  }

  function handleCellClick(event: CalendarGridEvent) {
    if (!isEditable.value) {
      return;
    }
    Text.create(editor.page, {
      sectionId: section.id,
      beforeId: null,
      sizing: "AUTO",
      content: [{ type: "paragraph", children: [] }],
      startDate: event.date,
      endDate: event.date,
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
      on:calendarcellclick={handleCellClick}
    >
      <Each items={tiles}>
        {(tile) => (
          <calendar-date
            start={tile.startDate.derive((d) => (d ? toISODate(d) : null))}
            end={tile.endDate.derive((d) => (d ? toISODate(d) : null))}
          >
            <Item
              editable={isEditable}
              tile={tile}
              tabindex={tabindex}
              resize={resize}
            />
          </calendar-date>
        )}
      </Each>
    </calendar-grid>
  );
}

import Item from "@/components/item/Item";
import { toISODate } from "@/utils/dates";
import Each from "@/jsx/each";
import styles from "./CalendarSection.module.css";
import type SectionModel from "@/models/Section";
import type { ResizeDirection } from "@/elements/item/PageItem";
import type { Reactive } from "@/utils/reactivity";

export interface CalendarSectionProps {
  section: SectionModel;
  tabindex: Reactive<number | undefined>;
  resize: Reactive<ResizeDirection | null>;
}

export default function CalendarSection({
  section,
  tabindex,
  resize,
}: CalendarSectionProps) {
  const { tiles, editor } = section;
  const { isEditable } = editor;

  return (
    <calendar-grid
      classList={{ [styles.calendar]: true }}
      data-section-id={section.id}
      data-layout="CALENDAR"
      tabindex={tabindex}
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

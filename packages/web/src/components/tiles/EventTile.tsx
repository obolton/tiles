import { useCallback } from "react";
import Tile from "./Tile";
import ArrowRightIcon from "@/icons/arrow-right.svg?jsx";
import styles from "./EventTile.module.css";
import { classNames } from "@/utils/css";
import { showModal } from "@/utils/modals";
import { useEditor } from "@/context/editor";
import useEditable from "@/hooks/useEditable";
import type { ClientEvent } from "@/types/tiles";
import type { EventModalResult } from "@/components/modals/EventModal";

interface EventTileProps extends ClientEvent {
  columns: number;
}

interface DateTimeDetailsProps {
  date: Date;
  size: "small" | "medium" | "large";
}

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  timeZone: "UTC",
});
const dayFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  timeZone: "UTC",
});
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "numeric",
  timeZone: "UTC",
});

function DateTimeDetails({ date, size }: DateTimeDetailsProps) {
  return (
    <time
      className={classNames(styles["date-time"], styles[size])}
      dateTime={date.toISOString()}
    >
      <div className={styles.date}>
        <span className={styles.month}>{monthFormatter.format(date)}</span>
        <span className={styles.day}>{dayFormatter.format(date)}</span>
      </div>

      <div className={styles.time}>{timeFormatter.format(date)}</div>
    </time>
  );
}

function DateDetails({ date, size }: DateTimeDetailsProps) {
  return (
    <time
      className={classNames(styles.date, styles[size])}
      dateTime={date.toISOString()}
    >
      <span className={styles.month}>{monthFormatter.format(date)}</span>
      <span className={styles.day}>{dayFormatter.format(date)}</span>
    </time>
  );
}

export default function EventTile({
  id,
  columns,
  title,
  start,
  end,
  allDay,
}: EventTileProps) {
  const editor = useEditor();
  const isEditable = useEditable();

  const edit = useCallback(
    () =>
      showModal<EventModalResult>("EVENT", {
        title,
        start,
        end,
        allDay,
        async onConfirm(event) {
          await editor.updateEvent({ id, ...event });
        },
      }),
    [id, title, start, end, allDay, editor],
  );

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const size = endDate ? (allDay ? "medium" : "small") : "large";

  return (
    <Tile>
      <div className={styles.event} onClick={isEditable ? edit : undefined}>
        <section className={styles.details}>
          <h3>{title}</h3>

          <div className={styles.dates}>
            {allDay ? (
              <DateDetails date={startDate} size={size} />
            ) : (
              <DateTimeDetails date={startDate} size={size} />
            )}

            {endDate ? (
              <>
                <ArrowRightIcon aria-hidden="true" />
                {allDay ? (
                  <DateDetails date={endDate} size={size} />
                ) : (
                  <DateTimeDetails date={endDate} size={size} />
                )}
              </>
            ) : null}
          </div>
        </section>

        {columns && columns > 1 ? (
          <calendar-month date={startDate.toISOString()} />
        ) : null}
      </div>
    </Tile>
  );
}

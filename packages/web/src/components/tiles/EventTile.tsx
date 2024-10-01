import { useCallback } from "react";
import { editTile } from "@/utils/edit";
import Tile, { type TileProps } from "./Tile";
import Icon from "@/components/icons/Icon";
import arrowRightIcon from "@/icons/arrow-right.svg";
import arrowDownIcon from "@/icons/arrow-down.svg";
import styles from "./EventTile.module.css";
import { classNames } from "@/utils/css";
import type { ClientEvent } from "@/types/tiles";

interface EventTileProps extends TileProps {
  event: ClientEvent;
}

interface DateTimeProps {
  date: Date;
  showTime?: boolean;
  size: "small" | "medium" | "large";
}

const yearFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  timeZone: "UTC",
});
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

function DateTime({ date, showTime = true, size }: DateTimeProps) {
  return (
    <time
      className={classNames(styles["date-time"], styles[size])}
      dateTime={date.toISOString()}
    >
      <div className={styles.date}>
        <span className={styles.month}>{monthFormatter.format(date)}</span>
        <span className={styles.day}>{dayFormatter.format(date)}</span>
      </div>

      {showTime ? (
        <div className={styles.time}>{timeFormatter.format(date)}</div>
      ) : null}
    </time>
  );
}

export default function EventTile({
  id,
  columns,
  event,
  ...props
}: EventTileProps) {
  const { title, start, end, allDay } = event;
  const edit = useCallback(() => editTile(id, "EVENT", event), [id, event]);

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const size = endDate ? (allDay ? "medium" : "small") : "large";

  return (
    <Tile id={id} columns={columns} {...props}>
      <div className={styles.event} onClick={edit}>
        <header className={styles.header}>
          {yearFormatter.format(startDate)}
        </header>
        <div className={styles.grid}>
          <section className={styles.details}>
            <div
              className={classNames(styles.dates, allDay && styles["all-day"])}
            >
              <DateTime date={startDate} showTime={!allDay} size={size} />

              {endDate ? (
                <>
                  <Icon src={allDay ? arrowRightIcon.src : arrowDownIcon.src} />
                  <DateTime date={endDate} showTime={!allDay} size={size} />
                </>
              ) : null}
            </div>

            <h3>{title}</h3>
          </section>
          {columns && columns > 1 ? (
            <calendar-month date={startDate.toISOString()} />
          ) : null}
        </div>
      </div>
    </Tile>
  );
}

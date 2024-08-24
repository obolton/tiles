import { useCallback } from "react";
import { editTile } from "@/utils/edit";
import Tile from "./Tile";
import Icon from "@/components/icons/Icon";
import arrowRightIcon from "@/icons/arrow-right.svg";
import arrowDownIcon from "@/icons/arrow-down.svg";
import styles from "./EventTile.module.css";
import type { ClientEventTile } from "@/types/tiles";

type EventTileProps = {
  tile: ClientEventTile;
};

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
    <time className={styles["date-time"]} dateTime={date.toISOString()}>
      <div className={`${styles.date} ${styles[size]}`}>
        <span className={styles.month}>{monthFormatter.format(date)}</span>
        <span className={styles.day}>{dayFormatter.format(date)}</span>
      </div>

      {showTime ? (
        <div className={styles.time}>{timeFormatter.format(date)}</div>
      ) : null}
    </time>
  );
}

export default function EventTile({ tile }: EventTileProps) {
  const {
    id,
    event: { title, start, end, allDay },
  } = tile;
  const edit = useCallback(() => editTile(id, "EVENT"), [id]);

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  const size = endDate ? (allDay ? "medium" : "small") : "large";

  return (
    <Tile tile={tile} showInLightbox={false}>
      <div className={styles.event} onClick={edit}>
        <header className={styles.header}>
          {yearFormatter.format(startDate)}
        </header>
        <div className={styles.grid}>
          <section className={styles.details}>
            <h3>{title}</h3>

            <div
              className={`${styles.dates} ${allDay ? styles["all-day"] : ""}`}
            >
              <DateTime date={startDate} showTime={!allDay} size={size} />

              {endDate ? (
                <>
                  <Icon
                    src={allDay ? arrowRightIcon.src : arrowDownIcon.src}
                    className={styles.icon}
                  />
                  <DateTime date={endDate} showTime={!allDay} size={size} />
                </>
              ) : null}
            </div>
          </section>
          <calendar-month date={startDate.toISOString()} />
        </div>
      </div>
    </Tile>
  );
}

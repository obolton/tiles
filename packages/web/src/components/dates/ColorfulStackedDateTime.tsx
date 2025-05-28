import styles from "./ColorfulStackedDateTime.module.css";
import { Computed } from "@/utils/reactivity";
import type { DateTimeThemeProps } from "./themes";

export default function ColorfulStackedDateTime({
  value,
  time,
}: DateTimeThemeProps) {
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

  return (
    <time
      className={styles.datetime}
      dateTime={
        new Computed([value, time] as const, (date, showTime) =>
          showTime ? date.toISOString() : date.toISOString().slice(0, 10),
        )
      }
    >
      <span className={styles.date}>
        <span className={styles.month}>
          {value.derive((date) => monthFormatter.format(date))}
        </span>
        <span className={styles.day}>
          {value.derive((date) => dayFormatter.format(date))}
        </span>
      </span>
      {time.derive((showTime) =>
        showTime ? (
          <span className={styles.time}>
            {value.derive((date) => timeFormatter.format(date))}
          </span>
        ) : null,
      )}
    </time>
  );
}

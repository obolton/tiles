import styles from "./ColorfulStackedDateTime.module.css";
import { combine } from "@/utils/reactivity";
import type { DateTimeThemeProps } from "./themes";

export default function ColorfulStackedDateTime({ value, time }: DateTimeThemeProps) {
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
      datetime={combine({ value, time }, ({ value, time }) =>
        time ? value.toISOString() : value.toISOString().slice(0, 10),
      )}
    >
      <span className={styles.date}>
        <span className={styles.month}>{value.derive((date) => monthFormatter.format(date))}</span>
        <span className={styles.day}>{value.derive((date) => dayFormatter.format(date))}</span>
      </span>
      {time.derive((showTime) =>
        showTime ? (
          <>
            &nbsp;
            <span className={styles.time}>
              {value.derive((date) => timeFormatter.format(date))}
            </span>
          </>
        ) : null,
      )}
    </time>
  );
}

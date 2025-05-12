import styles from "./DateTime.module.css";
import type { JSX } from "@/jsx/jsx";
import type { StoreInterface } from "@/utils/stores";
import { DerivedStore } from "@/utils/stores";

export interface DateTimeProps
  extends Omit<JSX.Attributes<HTMLTimeElement>, "dateTime" | "className"> {
  value: StoreInterface<Date>;
  time: StoreInterface<boolean>;
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

export default function DateTime({ value, time, ...props }: DateTimeProps) {
  return (
    <time
      {...props}
      className={styles.datetime}
      dateTime={
        new DerivedStore([value, time] as const, (date, showTime) =>
          showTime ? date.toISOString() : date.toISOString().slice(0, 10),
        )
      }
    >
      <span className={styles.month}>
        {value.derive((date) => monthFormatter.format(date))}
      </span>
      &nbsp;
      <span className={styles.day}>
        {value.derive((date) => dayFormatter.format(date))}
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

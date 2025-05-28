import { Computed } from "@/utils/reactivity";
import type { DateTimeThemeProps } from "./themes";

export default function DefaultDateTime({ value, time }: DateTimeThemeProps) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: time.value ? "short" : undefined,
    timeZone: "UTC",
  });

  return (
    <time
      dateTime={
        new Computed([value, time] as const, (date, showTime) =>
          showTime ? date.toISOString() : date.toISOString().slice(0, 10),
        )
      }
    >
      {value.derive((date) => formatter.format(date))}
    </time>
  );
}

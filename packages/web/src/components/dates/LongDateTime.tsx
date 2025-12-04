import { Computed } from "@/utils/reactivity";
import type { DateTimeThemeProps } from "./themes";

export default function LongDateTime({ value, time }: DateTimeThemeProps) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: time.value ? "short" : undefined,
    timeZone: "UTC",
  });

  return (
    <time
      datetime={
        new Computed([value, time] as const, (date, showTime) =>
          showTime ? date.toISOString() : date.toISOString().slice(0, 10),
        )
      }
    >
      {value.derive((date) => formatter.format(date))}
    </time>
  );
}

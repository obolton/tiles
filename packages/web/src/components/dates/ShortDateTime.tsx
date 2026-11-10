import { combine } from "carillon";
import type { DateTimeThemeProps } from "./themes";

export default function ShortDateTime({ value, time }: DateTimeThemeProps) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: time.value ? "short" : undefined,
    timeZone: "UTC",
  });

  return (
    <time
      datetime={combine({ value, time }, ({ value, time }) =>
        time ? value.toISOString() : value.toISOString().slice(0, 10),
      )}
    >
      {value.derive((date) => formatter.format(date))}
    </time>
  );
}

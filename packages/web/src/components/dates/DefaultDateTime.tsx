import { combine } from "@/utils/reactivity";
import type { DateTimeThemeProps } from "./themes";

export default function DefaultDateTime({ value, time }: DateTimeThemeProps) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
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

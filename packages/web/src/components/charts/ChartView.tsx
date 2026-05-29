import Each from "@/jsx/each";
import Editor from "@/editor/Editor";
import Table from "@/models/Table";
import { toPlainText } from "@/utils/richText/plainText";
import type Chart from "@/models/Chart";
import type { RichText } from "@/utils/richText/types";

function toNumber(input: number | string | RichText | null | undefined) {
  if (typeof input === "number") {
    return input;
  }

  if (!input) {
    return null;
  }

  const text = Array.isArray(input) ? toPlainText(input) : input;
  const value = parseFloat(text);
  return Number.isNaN(value) ? null : value;
}

export interface ChartViewProps {
  chart: Chart;
  className?: string;
}

export default function ChartView({ chart, className }: ChartViewProps) {
  if (import.meta.env.SSR) {
    return null;
  }

  return (
    <chart-view className={className}>
      <Each items={chart.series}>
        {(series) => (
          <chart-series
            type={series.type}
            color={series.fill.derive((fill) => {
              switch (fill?.type) {
                case "color":
                  return fill.color;
                case "gradient":
                  return `${fill.colorA},${fill.colorB}`;
                default:
                  return null;
              }
            })}
            gradient={series.fill.derive((fill) =>
              fill?.type === "gradient" ? fill.direction : null,
            )}
            $values={Editor.current.page
              .getTile(chart.tableId.value, Table)
              .getColumnData(series.column.value.id)
              .value.map(toNumber)}
          />
        )}
      </Each>
    </chart-view>
  );
}

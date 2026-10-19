import Each from "jsx/each";
import Editor from "@/editor/Editor";
import Table from "@/models/Table";
import { toPlainText } from "@/utils/richText/plainText";
import type Chart from "@/models/Chart";
import type { RichText } from "doc/types/richText";

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
            label={series.column.derive((column) => column.title)}
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
            bind:values={Editor.current.page
              .getTile(chart.tableId.value, Table)
              .getColumnData(series.column.value.id)
              .derive((cells) => cells.map(toNumber))}
          />
        )}
      </Each>
    </chart-view>
  );
}

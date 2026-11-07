import Each from "jsx/each";
import { toCellText, toNumber } from "@/utils/charts";
import type Chart from "@/models/Chart";

export interface ChartViewProps {
  chart: Chart;
  className?: string;
}

/** The chart of its table's data. Renders nothing while the table is missing. */
export default function ChartView({ chart, className }: ChartViewProps) {
  if (import.meta.env.SSR) {
    return null;
  }

  const labelColumnId = chart.label.derive((label) => label?.id ?? null);

  return chart.table.derive(
    (table) =>
      table && (
        <chart-view
          className={className}
          bind:labels={table.getColumnData(labelColumnId).derive((cells) => cells.map(toCellText))}
        >
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
                bind:values={table
                  .getColumnData(series.column.value.id)
                  .derive((cells) => cells.map(toNumber))}
              />
            )}
          </Each>
        </chart-view>
      ),
  );
}

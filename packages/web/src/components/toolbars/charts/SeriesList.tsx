import Each from "@/jsx/each";
import Editor from "@/editor/Editor";
import type { ChartProperties, TableProperties } from "@/types/tiles";

export interface SeriesListProps {
  chart: ChartProperties;
  table: TableProperties;
}

export default function SeriesList({ chart, table }: SeriesListProps) {
  function setLabel(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;
    Editor.current.updateChart({ id: chart.id, labelColumnId: value });
  }

  function addSeries(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;
    Editor.current.addChartSeries({ chartId: chart.id, columnId: value });
  }

  return (
    <>
      <label>
        Label
        <select id={`${chart.id}-label-select`} on:change={setLabel}>
          <option value="" disabled>
            Label
          </option>
          <Each items={table.columns}>
            {(column) => (
              <option
                value={column.id}
                selected={
                  chart.label.value?.id === column.id ? true : undefined
                }
              >
                {column.title ?? "Column"}
              </option>
            )}
          </Each>
        </select>
      </label>

      <ol>
        <Each items={chart.series}>
          {(item) => <li>{item.column.title ?? "Column"}</li>}
        </Each>
      </ol>

      <label>
        Add a series
        <select on:change={addSeries}>
          <Each items={table.columns}>
            {(column) => (
              <option value={column.id}>{column.title ?? "Column"}</option>
            )}
          </Each>
        </select>
      </label>
    </>
  );
}

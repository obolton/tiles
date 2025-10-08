import Each from "@/jsx/each";
import Row from "@/components/rows/Row";
import Editor from "@/editor/Editor";
import styles from "./SeriesList.module.css";
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

  function deleteSeries(seriesId: string) {
    Editor.current.deleteChartSeries({ chartId: chart.id, seriesId });
  }

  return (
    <div className={styles.container}>
      <label>
        Data
        <ol className={styles.list}>
          <Each items={chart.series}>
            {(item) => (
              <Row
                data={item.id}
                title={item.column.title ?? "Column"}
                showRemoveButton
                onRemove={deleteSeries}
              />
            )}
          </Each>
        </ol>
      </label>

      <label>
        Add a series
        <select on:change={addSeries}>
          <option value="" selected disabled>
            Column
          </option>
          <Each items={table.columns}>
            {(column) => (
              <option value={column.id}>{column.title ?? "Column"}</option>
            )}
          </Each>
        </select>
      </label>

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
    </div>
  );
}

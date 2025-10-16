import Each from "@/jsx/each";
import SeriesRow from "./SeriesRow";
import styles from "./SeriesList.module.css";
import type Chart from "@/items/Chart";
import type { Series, ChartType } from "@/items/Chart";
import type Table from "@/items/Table";

export interface SeriesListProps {
  chart: Chart;
  table: Table;
}

export default function SeriesList({ chart, table }: SeriesListProps) {
  function setLabel(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;
    const property =
      table.columns.find((column) => column.id === value) ?? null;
    chart.setLabel(property);
  }

  async function addSeries(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;
    chart.addSeries(value);
  }

  function setChartType(type: ChartType, series: Series) {
    chart.setSeriesChartType(series.id, type);
  }

  function deleteSeries(series: Series) {
    chart.deleteSeries(series.id);
  }

  return (
    <div className={styles.container}>
      <ol className={styles.list}>
        <Each items={chart.series}>
          {(item) => (
            <SeriesRow
              series={item}
              onSetChartType={setChartType}
              onDelete={deleteSeries}
            />
          )}
        </Each>
      </ol>

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

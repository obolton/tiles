import Each from "@/jsx/each";
import SeriesRow from "./SeriesRow";
import Editor from "@/editor/Editor";
import styles from "./SeriesList.module.css";
import { record } from "@/utils/reactivity";
import type {
  ChartSeries,
  ChartSeriesProperties,
  ChartProperties,
  TableProperties,
} from "@/types/tiles";

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

  async function addSeries(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    const value = select.value;
    const series = await Editor.current.addChartSeries({
      chartId: chart.id,
      columnId: value,
    });
    const { id, ...seriesProperties } = series;
    chart.series.value = chart.series.value.concat({
      id,
      ...record(seriesProperties),
    });
  }

  function setChartType(
    type: ChartSeries["type"],
    series: ChartSeriesProperties,
  ) {
    series.type.value = type;
    Editor.current.updateChartSeries({
      chartId: chart.id,
      seriesId: series.id,
      type,
    });
  }

  function deleteSeries(series: ChartSeriesProperties) {
    chart.series.value = chart.series.value.filter((s) => s.id !== series.id);
    Editor.current.deleteChartSeries({
      chartId: chart.id,
      seriesId: series.id,
    });
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

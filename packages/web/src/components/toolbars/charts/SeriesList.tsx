import Each from "@/jsx/each";
import MenuItem from "@/components/buttons/MenuItem";
import SeriesRow from "./SeriesRow";
import ParagraphIcon from "@/icons/paragraph.svg?jsx";
import styles from "./SeriesList.module.css";
import type Chart from "@/models/Chart";
import type { Series, ChartType } from "@/models/Chart";
import type Table from "@/models/Table";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";

export interface SeriesListProps {
  chart: Chart;
  table: Table;
}

export default function SeriesList({ chart, table }: SeriesListProps) {
  function setLabel(event: Event) {
    const select = event.currentTarget as SwatchSelect;
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

      <swatch-select
        id={`${chart.id}-label-select`}
        role="menuitem"
        aria-label="Label"
        data-tooltip="Label"
        label="Label"
        orientation="vertical"
        align="center"
        showvalue
        value={chart.label.derive((label) => label?.id ?? "")}
        on:change={setLabel}
      >
        <ParagraphIcon slot="default-icon" aria-hidden="true" />
        <ul className="menuitemgroup" role="group">
          <Each items={table.columns}>
            {(column) => (
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  value={column.id}
                  data-label={column.title || "Column"}
                >
                  {column.title || "Column"}
                </MenuItem>
              </li>
            )}
          </Each>
        </ul>
      </swatch-select>
    </div>
  );
}

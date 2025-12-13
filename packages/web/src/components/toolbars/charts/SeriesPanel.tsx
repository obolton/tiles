import Each from "@/jsx/each";
import MenuItem from "@/components/buttons/MenuItem";
import SeriesRow from "./SeriesRow";
import NewIcon from "@/icons/new.svg?jsx";
import ParagraphIcon from "@/icons/paragraph.svg?jsx";
import styles from "./SeriesPanel.module.css";
import { Computed } from "@/utils/reactivity";
import type Chart from "@/models/Chart";
import type { Series, ChartType } from "@/models/Chart";
import type Table from "@/models/Table";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";
import type { ColorFill, GradientFill } from "@/components/fills/types";

export interface SeriesPanelProps extends JSX.Attributes<"popover-menu"> {
  chart: Chart;
  table: Table;
}

export default function SeriesPanel({
  chart,
  table,
  ...props
}: SeriesPanelProps) {
  const availableColumns = new Computed(
    [chart.series, table.columns] as const,
    (series, columns) => {
      const usedColumnIds = new Set(series.map((s) => s.column.value.id));
      return columns.filter((column) => !usedColumnIds.has(column.id));
    },
  );

  function setLabel(event: Event) {
    const select = event.currentTarget as SwatchSelect;
    const value = select.value;
    const property =
      table.columns.find((column) => column.id === value) ?? null;
    chart.setLabel(property);
  }

  function addSeries(event: Event) {
    const select = event.currentTarget as SwatchSelect;
    const value = select.value;
    if (value) {
      chart.addSeries(value);
    }
  }

  function setChartType(type: ChartType, series: Series) {
    chart.setSeriesChartType(series.id, type);
  }

  function setSeriesFill(
    fill: ColorFill | GradientFill | null,
    series: Series,
  ) {
    chart.setSeriesFill(series.id, fill);
  }

  function deleteSeries(series: Series) {
    chart.deleteSeries(series.id);
  }

  return (
    <popover-menu {...props} className={styles.panel}>
      <ul className={styles["series-list"]} role="group" aria-label="Series">
        <Each items={chart.series}>
          {(item) => (
            <SeriesRow
              series={item}
              onSetChartType={setChartType}
              onSetFill={setSeriesFill}
              onDelete={deleteSeries}
            />
          )}
        </Each>
      </ul>

      <div className={styles.controls}>
        <swatch-select
          aria-label="Add series"
          data-tooltip="Add series"
          label="Add series"
          orientation="vertical"
          align="auto"
          on:change={addSeries}
        >
          <NewIcon slot="default-icon" aria-hidden="true" />
          <ul className="menuitemgroup" role="group">
            <Each items={availableColumns}>
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

        <swatch-select
          aria-label="Label column"
          data-tooltip="Label column"
          label="Label"
          orientation="vertical"
          align="auto"
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
    </popover-menu>
  );
}

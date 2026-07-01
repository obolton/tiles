import Each from "@/jsx/each";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import SeriesRow from "./SeriesRow";
import NewIcon from "@/icons/new.svg?jsx";
import ParagraphIcon from "@/icons/paragraph.svg?jsx";
import styles from "./SeriesPanel.module.css";
import { combine } from "@/utils/reactivity";
import type Chart from "@/models/Chart";
import type Series from "@/models/Series";
import type { ChartType } from "@/models/Series";
import type Table from "@/models/Table";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "@/jsx/jsx";
import type { ColorFill, GradientFill } from "@/components/fills/types";

export interface SeriesPanelProps extends JSX.Attributes<"anchored-popover"> {
  chart: Chart;
  table: Table;
}

export default function SeriesPanel({
  chart,
  table,
  ...props
}: SeriesPanelProps) {
  const availableColumns = combine(
    {
      series: chart.series,
      columns: table.columns,
    },
    ({ series, columns }) => {
      const usedColumnIds = new Set(series.map((s) => s.column.value.id));
      return columns.filter((column) => !usedColumnIds.has(column.id));
    },
  );

  function setLabel(event: Event) {
    const select = event.currentTarget as ListSelect;
    const value = select.value;
    const column = table.columns.value.find((c) => c.id === value);
    chart.label.value = column
      ? { id: column.id, title: column.title.value }
      : null;
  }

  function addSeries(event: Event) {
    const select = event.currentTarget as ListSelect;
    const value = select.value;
    const column = table.columns.value.find((c) => c.id === value);
    if (column) {
      chart.addSeries({ id: column.id, title: column.title.value });
    }
  }

  function setChartType(type: ChartType, series: Series) {
    series.type.value = type;
  }

  function setSeriesFill(
    fill: ColorFill | GradientFill | null,
    series: Series,
  ) {
    series.fill.value = fill;
  }

  function deleteSeries(series: Series) {
    chart.series.remove(series.id);
  }

  return (
    <anchored-popover {...props} className={styles.panel}>
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
        <list-select
          aria-label="Add series"
          data-tooltip="Add series"
          label="Add series"
          orientation="vertical"
          align="auto"
          on:change={addSeries}
        >
          <NewIcon slot="default-icon" aria-hidden="true" />
          <ListGroup>
            <Each items={availableColumns}>
              {(column) => (
                <ListOption value={column.id}>
                  {column.title.derive((title) => title || "Column")}
                </ListOption>
              )}
            </Each>
          </ListGroup>
        </list-select>

        <list-select
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
          <ListGroup>
            <Each items={table.columns}>
              {(column) => (
                <ListOption value={column.id}>
                  {column.title.derive((title) => title || "Column")}
                </ListOption>
              )}
            </Each>
          </ListGroup>
        </list-select>
      </div>
    </anchored-popover>
  );
}

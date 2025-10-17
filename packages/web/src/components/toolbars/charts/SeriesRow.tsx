import Row from "@/components/rows/Row";
import BarChartIcon from "@/icons/bar-chart.svg?jsx";
import LineChartIcon from "@/icons/line-chart.svg?jsx";
import AreaChartIcon from "@/icons/area-chart.svg?jsx";
import RemoveIcon from "@/icons/remove.svg?jsx";
import type { Series, ChartType } from "@/models/Chart";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";

const CHART_SERIES_TYPE_ICON = {
  BAR: <BarChartIcon aria-hidden="true" slot="icon" />,
  LINE: <LineChartIcon aria-hidden="true" slot="icon" />,
  AREA: <AreaChartIcon aria-hidden="true" slot="icon" />,
} as const;

export interface SeriesRowProps {
  series: Series;
  onSetChartType: (type: ChartType, series: Series) => void;
  onDelete: (series: Series) => void;
}

export default function SeriesRow({
  series,
  onSetChartType,
  onDelete,
}: SeriesRowProps) {
  return (
    <Row
      title={series.column.derive((column) => column.title ?? "Column")}
      controls={
        <>
          <swatch-select
            aria-label="Chart type"
            data-tooltip="Chart type"
            aria-orientation="horizontal"
            orientation="horizontal"
            align="center"
            value={series.type}
            on:change={(event) => {
              const type = (event.currentTarget as SwatchSelect).value as
                | "BAR"
                | "LINE"
                | "AREA";
              onSetChartType(type, series);
            }}
          >
            {series.type.derive((value) => CHART_SERIES_TYPE_ICON[value])}

            <swatch-item value="BAR" data-tooltip="Bar chart">
              <BarChartIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="LINE" data-tooltip="Line chart">
              <LineChartIcon aria-hidden="true" />
            </swatch-item>
            <swatch-item value="AREA" data-tooltip="Area chart">
              <AreaChartIcon aria-hidden="true" />
            </swatch-item>
          </swatch-select>

          <button
            type="button"
            className="floating small"
            aria-label="Remove"
            on:click={() => onDelete(series)}
          >
            <RemoveIcon aria-hidden="true" />
          </button>
        </>
      }
    />
  );
}

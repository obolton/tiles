import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import Row from "@/components/rows/Row";
import FillPicker from "@/components/fills/FillPicker";
import BarChartIcon from "@/icons/bar-chart.svg?jsx";
import LineChartIcon from "@/icons/line-chart.svg?jsx";
import AreaChartIcon from "@/icons/area-chart.svg?jsx";
import RemoveIcon from "@/icons/remove.svg?jsx";
import type Series from "@/models/Series";
import type { ChartType } from "@/models/Series";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface SeriesRowProps {
  series: Series;
  onSetChartType: (type: ChartType, series: Series) => void;
  onSetFill: (fill: ColorFill | GradientFill | null, series: Series) => void;
  onDelete: (series: Series) => void;
}

export default function SeriesRow({ series, onSetChartType, onSetFill, onDelete }: SeriesRowProps) {
  return (
    <Row
      title={series.column.derive((column) => column.title || "Column")}
      controls={
        <>
          <FillPicker
            id={`series-${series.id}-fill`}
            value={series.fill}
            aria-pressed={series.fill}
            onChange={(fill) => {
              if (fill === null || fill.type !== "image") {
                onSetFill(fill, series);
              }
            }}
            allowImage={false}
          />

          <list-select
            aria-label="Chart type"
            data-tooltip="Chart type"
            orientation="vertical"
            align="center"
            value={series.type}
            on:change={(event) => {
              const type = (event.currentTarget as ListSelect).value as "BAR" | "LINE" | "AREA";
              onSetChartType(type, series);
            }}
          >
            <ListGroup>
              <ListOption icon={<BarChartIcon aria-hidden="true" />} value="BAR">
                Bar chart
              </ListOption>
              <ListOption icon={<LineChartIcon aria-hidden="true" />} value="LINE">
                Line chart
              </ListOption>
              <ListOption icon={<AreaChartIcon aria-hidden="true" />} value="AREA">
                Area chart
              </ListOption>
            </ListGroup>
          </list-select>

          <button
            type="button"
            className="floating"
            aria-label="Remove"
            data-tooltip="Remove"
            on:click={() => onDelete(series)}
          >
            <RemoveIcon aria-hidden="true" />
          </button>
        </>
      }
    />
  );
}

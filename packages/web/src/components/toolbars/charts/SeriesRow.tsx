import MenuItem from "@/components/buttons/MenuItem";
import Row from "@/components/rows/Row";
import FillPicker from "@/components/fills/FillPicker";
import BarChartIcon from "@/icons/bar-chart.svg?jsx";
import LineChartIcon from "@/icons/line-chart.svg?jsx";
import AreaChartIcon from "@/icons/area-chart.svg?jsx";
import RemoveIcon from "@/icons/remove.svg?jsx";
import type { Series, ChartType } from "@/models/Chart";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type ListSelect from "@/elements/list-select/ListSelect";

export interface SeriesRowProps {
  series: Series;
  onSetChartType: (type: ChartType, series: Series) => void;
  onSetFill: (fill: ColorFill | GradientFill | null, series: Series) => void;
  onDelete: (series: Series) => void;
}

export default function SeriesRow({
  series,
  onSetChartType,
  onSetFill,
  onDelete,
}: SeriesRowProps) {
  return (
    <Row
      title={series.column.derive((column) => column.title || "Column")}
      controls={
        <>
          <FillPicker
            id={`series-${series.id}-fill`}
            value={series.fill}
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
              const type = (event.currentTarget as ListSelect).value as
                | "BAR"
                | "LINE"
                | "AREA";
              onSetChartType(type, series);
            }}
          >
            <ul className="menuitemgroup" role="group">
              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<BarChartIcon aria-hidden="true" />}
                  value="BAR"
                  data-label="Bar chart"
                >
                  Bar chart
                </MenuItem>
              </li>

              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<LineChartIcon aria-hidden="true" />}
                  value="LINE"
                  data-label="Line chart"
                >
                  Line chart
                </MenuItem>
              </li>

              <li role="presentation">
                <MenuItem
                  classList={{ menuitem: true }}
                  icon={<AreaChartIcon aria-hidden="true" />}
                  value="AREA"
                  data-label="Area chart"
                >
                  Area chart
                </MenuItem>
              </li>
            </ul>
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

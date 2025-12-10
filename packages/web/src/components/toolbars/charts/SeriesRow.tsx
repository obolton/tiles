import MenuItem from "@/components/buttons/MenuItem";
import Row from "@/components/rows/Row";
import ColorPicker from "@/components/colors/ColorPicker";
import BarChartIcon from "@/icons/bar-chart.svg?jsx";
import LineChartIcon from "@/icons/line-chart.svg?jsx";
import AreaChartIcon from "@/icons/area-chart.svg?jsx";
import RemoveIcon from "@/icons/remove.svg?jsx";
import type { Series, ChartType } from "@/models/Chart";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Color } from "@/utils/color";

export interface SeriesRowProps {
  series: Series;
  onSetChartType: (type: ChartType, series: Series) => void;
  onSetColor: (color: Color, series: Series) => void;
  onDelete: (series: Series) => void;
}

export default function SeriesRow({
  series,
  onSetChartType,
  onSetColor,
  onDelete,
}: SeriesRowProps) {
  return (
    <Row
      title={series.column.derive((column) => column.title || "Column")}
      controls={
        <>
          <ColorPicker
            id={`series-${series.id}-color`}
            value={series.color}
            onChange={(color) => onSetColor(color, series)}
          />

          <swatch-select
            aria-label="Chart type"
            data-tooltip="Chart type"
            orientation="vertical"
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
          </swatch-select>

          <button
            type="button"
            className="floating"
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

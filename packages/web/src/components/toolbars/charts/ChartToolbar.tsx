import ToolbarButton from "@/components/buttons/ToolbarButton";
import TileTools from "@/components/toolbars/tiles/TileTools";
import FillPicker from "@/components/fills/FillPicker";
import SeriesPanel from "./SeriesPanel";
import ChartIcon from "@/icons/chart.svg?jsx";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import type { FillUpdate } from "@/components/fills/types";
import type Chart from "@/models/Chart";

export interface ChartToolbarProps {
  chart: Chart;
}

export default function ChartToolbar({ chart }: ChartToolbarProps) {
  async function setBackground(value: FillUpdate) {
    try {
      await chart.setBackground(value);
    } catch (error) {
      handleError(error);
    }
  }

  const table = Editor.current.getTable(chart.tableId);

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Chart tools"
    >
      <ul role="group" aria-label="Chart tools">
        <li role="presentation">
          <ToolbarButton
            id={`${chart.id}-series-button`}
            label="Series"
            popovertarget={`${chart.id}-series-panel`}
            aria-haspopup="menu"
          >
            <ChartIcon aria-hidden="true" />
            Series
          </ToolbarButton>

          <SeriesPanel
            id={`${chart.id}-series-panel`}
            anchor={`${chart.id}-series-button`}
            chart={chart}
            table={table}
          />
        </li>
        <li role="presentation">
          <FillPicker
            id={`${chart.id}-background`}
            value={chart.background}
            onChange={setBackground}
          />
        </li>
      </ul>

      <TileTools tile={chart} />
    </floating-toolbar>
  );
}

import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
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
      <toolbar-tab label="Chart">
        <ToolbarGroup label="Chart tools">
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

          <FillPicker
            id={`${chart.id}-background`}
            label="Background"
            value={chart.background}
            onChange={setBackground}
          />
        </ToolbarGroup>

        <TileTools tile={chart} />
      </toolbar-tab>
    </floating-toolbar>
  );
}

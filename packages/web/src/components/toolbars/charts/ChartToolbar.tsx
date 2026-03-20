import ToolbarButton from "@/components/buttons/ToolbarButton";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import TileTools from "@/components/toolbars/tiles/TileTools";
import StyleTab from "@/components/toolbars/tiles/StyleTab";
import DateTab from "@/components/toolbars/tiles/DateTab";
import SeriesPanel from "./SeriesPanel";
import ChartIcon from "@/icons/chart.svg?jsx";
import Editor from "@/editor/Editor";
import Table from "@/models/Table";
import type Chart from "@/models/Chart";

export interface ChartToolbarProps {
  chart: Chart;
}

export default function ChartToolbar({ chart }: ChartToolbarProps) {
  const table = Editor.current.page.getTile(chart.tableId, Table);

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="bottom"
      aria-label="Chart tools"
    >
      <toolbar-tab name="chart" label="Chart">
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
            chart={chart}
            table={table}
          />
        </ToolbarGroup>

        <TileTools tile={chart} />
      </toolbar-tab>

      <StyleTab tile={chart} />

      <DateTab tile={chart} />
    </floating-toolbar>
  );
}

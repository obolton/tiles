import TileTools from "@/components/toolbars/tiles/TileTools";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import SeriesList from "./SeriesList";
import { handleError } from "@/utils/errors";
import Editor from "@/editor/Editor";
import type { BackgroundUpdate } from "@/components/backgrounds/types";
import type Chart from "@/models/Chart";

export interface ChartToolbarProps {
  chart: Chart;
}

export default function ChartToolbar({ chart }: ChartToolbarProps) {
  async function setBackground(value: BackgroundUpdate) {
    try {
      await chart.setBackground(value);
    } catch (error) {
      handleError(error);
    }
  }

  const table = Editor.current.getTable(chart.tableId);

  return (
    <floating-toolbar
      className="bottom-left"
      data-tooltip-position="left"
      aria-label="Chart tools"
    >
      <ul role="group" aria-label="Chart tools">
        <li role="presentation">
          <SeriesList chart={chart} table={table} />
        </li>
        <li role="presentation">
          <BackgroundPicker
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

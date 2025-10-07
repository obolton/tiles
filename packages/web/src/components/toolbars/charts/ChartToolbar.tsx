import ToolbarButton from "@/components/buttons/ToolbarButton";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import SeriesList from "./SeriesList";
import DeleteIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import Editor from "@/editor/Editor";
import type { Background } from "@/components/backgrounds/types";
import type { ChartProperties } from "@/types/tiles";

export interface ChartToolbarProps {
  chart: ChartProperties;
  anchorName: string;
}

export default function ChartToolbar({ chart, anchorName }: ChartToolbarProps) {
  async function setBackground(value: Background | null) {
    try {
      const { background: newBackground } = await Editor.current.updateChart({
        id: chart.id,
        background: value,
      });
      viewTransition(() => (chart.background.value = newBackground));
    } catch (error) {
      handleError(error);
    }
  }

  function deleteTile() {
    Editor.current.deleteTiles([chart.placementId]);
  }

  const table = Editor.current.getTable(chart.tableId.value);

  return (
    <floating-toolbar
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
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

      <ul role="group" aria-label="More tools">
        <li role="presentation">
          <ToolbarButton label="Delete" destructive on:click={deleteTile}>
            <DeleteIcon aria-hidden="true" />
          </ToolbarButton>
        </li>
      </ul>
    </floating-toolbar>
  );
}

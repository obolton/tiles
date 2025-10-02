import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import Editor from "@/editor/Editor";
import type { Background } from "@/components/backgrounds/types";
import type { ChartProperties } from "@/types/tiles";

export interface ChartToolbarProps {
  id: ChartProperties["id"];
  background: ChartProperties["background"];
  anchorName: string;
}

export default function ChartToolbar({
  id,
  background,
  anchorName,
}: ChartToolbarProps) {
  async function setBackground(value: Background | null) {
    try {
      const { background: newBackground } = await Editor.current.updateChart({
        id,
        background: value,
      });
      viewTransition(() => (background.value = newBackground));
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <floating-toolbar
      className="vertical anchored"
      style={{ positionAnchor: anchorName }}
      data-tooltip-position="left"
      aria-label="Chart tools"
    >
      <ul role="group">
        <li role="presentation">
          <BackgroundPicker
            id={`${id}-background`}
            workspaceId={Editor.current.workspaceId}
            value={background}
            onChange={setBackground}
          />
        </li>
      </ul>
    </floating-toolbar>
  );
}

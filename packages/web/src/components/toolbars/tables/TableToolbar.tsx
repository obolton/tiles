import TileTools from "@/components/toolbars/tiles/TileTools";
import ColorPicker from "@/components/colors/ColorPicker";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import { handleError } from "@/utils/errors";
import type { Color } from "@/utils/color";
import type { BackgroundUpdate } from "@/components/backgrounds/types";
import type Table from "@/models/Table";

export interface TableToolbarProps {
  table: Table;
}

export default function TableToolbar({ table }: TableToolbarProps) {
  const { id, textColor, background } = table;

  async function setTextColor(value: Color | null) {
    try {
      await table.setTextColor(value);
    } catch (error) {
      handleError(error);
    }
  }

  async function setBackground(value: BackgroundUpdate) {
    try {
      await table.setBackground(value);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <floating-toolbar
      className="primary"
      data-tooltip-position="top"
      aria-label="Table tools"
    >
      <ul role="group">
        <li role="presentation">
          <ColorPicker
            id={`${id}-color-picker`}
            value={textColor}
            onChange={setTextColor}
          />
        </li>
      </ul>

      <ul role="group">
        <li role="presentation">
          <BackgroundPicker
            id={`${id}-background`}
            value={background}
            onChange={setBackground}
          />
        </li>
      </ul>

      <TileTools tile={table} />
    </floating-toolbar>
  );
}

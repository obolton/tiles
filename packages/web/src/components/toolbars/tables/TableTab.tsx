import TileTools from "@/components/toolbars/tiles/TileTools";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ColorPicker from "@/components/colors/ColorPicker";
import FillPicker from "@/components/fills/FillPicker";
import { handleError } from "@/utils/errors";
import type { Color } from "@/utils/color";
import type { FillUpdate } from "@/components/fills/types";
import type Table from "@/models/Table";

export interface TableTabProps {
  table: Table;
}

export default function TableTab({ table }: TableTabProps) {
  const { id, textColor, background } = table;

  async function setTextColor(value: Color | null) {
    try {
      await table.setTextColor(value);
    } catch (error) {
      handleError(error);
    }
  }

  async function setBackground(value: FillUpdate) {
    try {
      await table.setBackground(value);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <toolbar-tab id="table" label="Table">
      <ToolbarGroup label="Style">
        <ColorPicker
          id={`${id}-color-picker`}
          value={textColor}
          onChange={setTextColor}
        />
        <FillPicker
          id={`${id}-background`}
          value={background}
          onChange={setBackground}
        />
      </ToolbarGroup>

      <TileTools tile={table} />
    </toolbar-tab>
  );
}

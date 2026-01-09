import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ColorPicker from "@/components/colors/ColorPicker";
import FillPicker from "@/components/fills/FillPicker";
import type Tile from "@/models/Tile";

export interface StyleToolsProps {
  tile: Tile;
}

export default function StyleTools({ tile }: StyleToolsProps) {
  const { id, textColor, background } = tile;

  return (
    <ToolbarGroup label="Style">
      <ColorPicker
        id={`${id}-color-picker`}
        value={textColor}
        onChange={(color) => tile.setTextColor(color)}
      />

      <FillPicker
        id={`${id}-background`}
        value={background}
        onChange={(background) => tile.setBackground(background)}
      />
    </ToolbarGroup>
  );
}

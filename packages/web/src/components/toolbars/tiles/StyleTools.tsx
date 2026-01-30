import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ThemePicker from "@/components/themes/ThemePicker";
import ColorPicker from "@/components/colors/ColorPicker";
import FillPicker from "@/components/fills/FillPicker";
import AnimationPicker from "@/components/animations/AnimationPicker";
import FramePicker from "@/components/frames/FramePicker";
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";

export interface StyleToolsProps {
  tile: Tile;
}

export default function StyleTools({ tile }: StyleToolsProps) {
  const { id, textColor, background, theme, animation } = tile;

  function setTheme(themeId: string | null) {
    tile.setTheme(themeId).catch(handleError);
  }

  return (
    <ToolbarGroup label="Style">
      <ThemePicker
        value={theme.derive((t) => t?.id ?? null)}
        onChange={setTheme}
        aria-label="Theme"
        data-tooltip="Theme"
      />

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

      <AnimationPicker
        value={animation}
        onChange={(animation) => tile.setAnimation(animation)}
      />

      <FramePicker tile={tile} onChange={(frame) => tile.setFrame(frame)} />
    </ToolbarGroup>
  );
}

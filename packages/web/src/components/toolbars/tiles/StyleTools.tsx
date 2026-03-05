import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import AspectRatioSelect from "@/components/toolbars/tiles/AspectRatioSelect";
import ThemePicker from "@/components/themes/ThemePicker";
import ColorPicker from "@/components/colors/ColorPicker";
import FillPicker from "@/components/fills/FillPicker";
import AnimationPicker from "@/components/animations/AnimationPicker";
import FramePicker from "@/components/frames/FramePicker";
import { resolveTheme, getThemeColors } from "@/utils/themes";
import { handleError } from "@/utils/errors";
import type Tile from "@/models/Tile";

export interface StyleToolsProps {
  tile: Tile;
}

export default function StyleTools({ tile }: StyleToolsProps) {
  const { id, textColor, background, theme, animation } = tile;
  const themeColors = theme.derive(() => {
    const resolved = resolveTheme(tile);
    return resolved ? getThemeColors(resolved) : [];
  });

  function setTheme(themeId: string | null) {
    tile.setTheme(themeId).catch(handleError);
  }

  return (
    <ToolbarGroup label="Style">
      <AspectRatioSelect
        value={tile.sizing}
        onChange={(d) => tile.setSizing(d).catch(handleError)}
        showAuto={tile.type === "TEXT" || tile.type === "TABLE"}
      />

      <ThemePicker
        id={`${id}-theme`}
        value={theme}
        onChange={setTheme}
        aria-label="Theme"
        data-tooltip="Theme"
      />

      <ColorPicker
        id={`${id}-color-picker`}
        value={textColor}
        onChange={(color) => tile.setTextColor(color)}
        themeColors={themeColors}
      />

      <FillPicker
        id={`${id}-background`}
        value={background}
        onChange={(background) => tile.setBackground(background)}
        aria-pressed={background}
        themeColors={themeColors}
      />

      <AnimationPicker
        value={animation}
        onChange={(animation) => tile.setAnimation(animation)}
      />

      <FramePicker tile={tile} onChange={(frame) => tile.setFrame(frame)} />
    </ToolbarGroup>
  );
}

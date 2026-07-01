import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import AspectRatioSelect from "@/components/toolbars/tiles/AspectRatioSelect";
import DockSelect from "@/components/toolbars/tiles/DockSelect";
import ThemePicker from "@/components/themes/ThemePicker";
import ColorPicker from "@/components/colors/ColorPicker";
import TextColorIcon from "@/icons/text-color.svg?jsx";
import FillPicker from "@/components/fills/FillPicker";
import AnimationPicker from "@/components/animations/AnimationPicker";
import FramePicker from "@/components/frames/FramePicker";
import { resolveTheme, getThemeColors, loadThemeFonts } from "@/utils/themes";
import { viewTransition } from "@/utils/transitions";
import type { JSX } from "@/jsx/jsx";
import type Theme from "@/models/Theme";
import type Tile from "@/models/Tile";

export interface StyleTabProps {
  tile: Tile;
  children?: JSX.Node;
}

export default function StyleTab({ tile, children }: StyleTabProps) {
  const { id, textColor, background, theme, animation } = tile;
  const themeColors = theme.derive(() => {
    const resolved = resolveTheme(tile);
    return resolved ? getThemeColors(resolved) : [];
  });

  async function setTheme(theme: Theme | null) {
    if (theme) {
      await loadThemeFonts(theme.id);
    }

    tile.setTheme(theme);
  }

  return (
    <toolbar-tab name="style" label="Style">
      <ToolbarGroup label="Layout">
        <AspectRatioSelect
          value={tile.sizing}
          onChange={(sizing) => tile.setSizing(sizing)}
          showAuto={tile.type === "TEXT" || tile.type === "TABLE" || tile.type === "IMAGE"}
        />

        {tile.page.type === "FREE" && <DockSelect tile={tile} />}
      </ToolbarGroup>

      <ToolbarGroup label="Appearance">
        <ThemePicker
          id={`${id}-theme`}
          value={theme}
          onChange={setTheme}
          aria-label="Theme"
          data-tooltip="Theme"
        />

        <ColorPicker
          id={`${id}-color-picker`}
          icon={<TextColorIcon aria-hidden="true" />}
          label="Text"
          value={textColor}
          onChange={(color) => viewTransition(() => tile.setTextColor(color))}
          themeColors={themeColors}
        />

        <FillPicker
          id={`${id}-background`}
          label="Background"
          value={background}
          onChange={(value) => (tile.background.value = value)}
          aria-pressed={background}
          themeColors={themeColors}
        />

        <AnimationPicker value={animation} onChange={(animation) => tile.setAnimation(animation)} />

        <FramePicker
          tile={tile}
          onChange={(frame) => {
            tile.frame.value = frame;
          }}
        />
      </ToolbarGroup>

      {children}
    </toolbar-tab>
  );
}

import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import AspectRatioSelect from "@/components/toolbars/tiles/AspectRatioSelect";
import DockSelect from "@/components/toolbars/tiles/DockSelect";
import ThemePicker from "@/components/themes/ThemePicker";
import ColorPicker from "@/components/colors/ColorPicker";
import TextColorIcon from "@/icons/text-color.svg?jsx";
import FrameIcon from "@/icons/frame.svg?jsx";
import FillPicker from "@/components/fills/FillPicker";
import AnimationPicker from "@/components/animations/AnimationPicker";
import FramePicker from "@/components/frames/FramePicker";
import If from "jsx/if";
import { resolveTheme, getThemeColors } from "@/utils/themes";
import { viewTransition } from "@/utils/transitions";
import { mediaQuery, NARROW_QUERY } from "@/utils/viewport";
import type { JSX } from "jsx/jsx";
import type Theme from "@/models/Theme";
import type Tile from "@/models/Tile";

export interface StyleTabProps {
  tile: Tile;
  children?: JSX.Node;
}

export default function StyleTab({ tile, children }: StyleTabProps) {
  const { id, textColor, borderColor, background, theme, animation, frame } = tile;
  const themeColors = theme.derive(() => {
    const resolved = resolveTheme(tile);
    return resolved ? getThemeColors(resolved) : [];
  });
  // Docks are hidden on narrow viewports (DockZone.module.css), so tiles cannot be sent to them there
  const canDock = mediaQuery(NARROW_QUERY).derive((narrow) => !narrow);
  const hasBorder = frame.derive((f) => f === "OUTLINED" || f === "FRAMED");

  function setTheme(theme: Theme | null) {
    tile.editor.undoManager?.stopCapturing();
    viewTransition(() => tile.setTheme(theme));
  }

  return (
    <toolbar-tab name="style" label="Style">
      <ToolbarGroup label="Layout">
        <AspectRatioSelect
          value={tile.sizing}
          onChange={(sizing) => tile.setSizing(sizing)}
          // Only tiles with intrinsic content height can be auto-sized
          showAuto={tile.type === "TEXT" || tile.type === "IMAGE"}
        />

        {tile.page.type === "LAYOUT" && (
          <If condition={canDock}>
            <DockSelect tile={tile} />
          </If>
        )}
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
          onChange={(color) => viewTransition(() => (tile.textColor.value = color))}
          themeColors={themeColors}
          showClear
          onClear={() => viewTransition(() => (tile.textColor.value = null))}
        />

        <FillPicker
          id={`${id}-background`}
          label="Background"
          value={background}
          onChange={(value) => (tile.background.value = value)}
          aria-pressed={background}
          themeColors={themeColors}
        />

        <AnimationPicker
          value={animation}
          onChange={(animation) => (tile.animation.value = animation)}
        />

        <FramePicker
          tile={tile}
          onChange={(frame) => {
            tile.frame.value = frame;
          }}
        />

        <If condition={hasBorder}>
          <ColorPicker
            id={`${id}-border-color`}
            icon={<FrameIcon aria-hidden="true" />}
            label="Border"
            value={borderColor}
            onChange={(color) => viewTransition(() => (tile.borderColor.value = color))}
            themeColors={themeColors}
            showClear
            onClear={() => viewTransition(() => (tile.borderColor.value = null))}
          />
        </If>
      </ToolbarGroup>

      {children}
    </toolbar-tab>
  );
}

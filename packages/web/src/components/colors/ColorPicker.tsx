import ToolbarButton from "@/components/buttons/ToolbarButton";
import ColorPalette from "@/components/colors/ColorPalette";
import { toCSSColor } from "@/utils/color";
import styles from "./ColorPicker.module.css";
import type { Color } from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";
import type { ThemeColor } from "@/components/colors/ColorPalette";
import type { JSX } from "@/jsx/jsx";

export interface ColorPickerProps {
  id: string;
  icon: JSX.Element;
  label?: string;
  themeColors?: Reactive<ThemeColor[]>;
  value?: Reactive<Color | null>;
  onChange: (value: Color) => void;
  showClear?: boolean;
  onClear?: () => void;
}

const ROWS = 5;
const MIN_LIGHTNESS = 0.2;
const MAX_LIGHTNESS = 1;
const CHROMA = 0.15;
const HUES = 10;
const START_HUE = 24;

export default function ColorPicker({
  id,
  icon,
  label = "Color",
  themeColors,
  value,
  onChange,
  showClear,
  onClear,
}: ColorPickerProps) {
  const popoverId = `${id}-popover`;

  return (
    <>
      <ToolbarButton
        id={id}
        popovertarget={popoverId}
        label={label}
        aria-haspopup="menu"
        aria-expanded="false"
        classList={{ [styles.picker]: true }}
        style={value?.derive((v) => (v ? { "--icon-color": toCSSColor(v) } : undefined))}
      >
        {icon}
        {label}
      </ToolbarButton>

      <anchored-popover id={popoverId} align="center">
        <ColorPalette
          rows={ROWS}
          minLightness={MIN_LIGHTNESS}
          maxLightness={MAX_LIGHTNESS}
          chroma={CHROMA}
          hues={HUES}
          startHue={START_HUE}
          themeColors={themeColors}
          value={value}
          onChange={onChange}
        />
        {showClear && (
          <button type="button" className={styles.clear} on:click={onClear}>
            Clear
          </button>
        )}
      </anchored-popover>
    </>
  );
}

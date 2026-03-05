import ToolbarButton from "@/components/buttons/ToolbarButton";
import ColorPalette from "@/components/colors/ColorPalette";
import TextColorIcon from "@/icons/text-color.svg?jsx";
import { toCSSColor } from "@/utils/color";
import styles from "./ColorPicker.module.css";
import type { Color } from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";
import type { ThemeColor } from "@/components/colors/ColorPalette";

export interface ColorPickerProps {
  id: string;
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
      >
        <TextColorIcon
          style={value?.derive((v) =>
            v ? { fill: toCSSColor(v) } : undefined,
          )}
          aria-hidden="true"
        />
      </ToolbarButton>

      <anchored-popover
        id={popoverId}
        className={styles["color-picker"]}
        align="center"
      >
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

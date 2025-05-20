import ClearColorIcon from "@/icons/clear-color.svg?jsx";
import styles from "./ColorPicker.module.css";
import { classNames } from "@/utils/css";
import { getColorName, isSameColor, type Color } from "@/utils/color";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";
import type { Reactive } from "@/utils/reactivity";

export interface ColorPickerProps
  extends Omit<JSX.Attributes<HTMLElement>, "value" | "onChange"> {
  className?: string;
  value?: Reactive<Color | null>;
  onChange: (value: Color | null) => void;
  showClear?: boolean;
}

const COLORS: Color[] = [];
const LIGHTNESS_LEVELS = 5;
const MIN_LIGHTNESS = 0.2;
const MAX_LIGHTNESS = 1;
const CHROMA = 0.2;
const HUES = 10;
const HUE_ROTATION = 24;

for (let l = LIGHTNESS_LEVELS - 1; l >= 0; l--) {
  for (let i = 0; i < HUES; i++) {
    COLORS.push({
      l:
        (l / (LIGHTNESS_LEVELS - 1)) * (MAX_LIGHTNESS - MIN_LIGHTNESS) +
        MIN_LIGHTNESS,
      c: CHROMA,
      h: HUE_ROTATION + (i / HUES) * 360,
    });
  }

  COLORS.push({
    l:
      (l / (LIGHTNESS_LEVELS - 1)) * (MAX_LIGHTNESS - MIN_LIGHTNESS) +
      MIN_LIGHTNESS,
    c: 0,
    h: 0,
  });
}

function getColorIndex(color: Color | null) {
  if (!color) {
    return null;
  }
  const index = COLORS.findIndex((compareColor) =>
    isSameColor(compareColor, color),
  );
  return index >= 0 ? index.toString() : null;
}

export default function ColorPicker({
  className,
  value,
  onChange,
  showClear = false,
  ...props
}: ColorPickerProps) {
  function setColor(event: Event) {
    const element = event.target as SwatchSelect;
    const value = element.value;
    if (value === "CLEAR" || !value) {
      onChange(null);
      return;
    }
    const index = parseInt(value, 10);
    const color = COLORS[index] ?? null;
    onChange(color);
  }

  return (
    <swatch-select
      {...props}
      className={classNames(styles["color-picker"], className)}
      aria-orientation="horizontal"
      align="center"
      value={value?.derive(getColorIndex)}
      onchange={setColor}
    >
      {COLORS.map((color, i) => (
        <swatch-item
          aria-label={getColorName(color)}
          style={{
            "--lightness": `${color.l.toFixed(2)}`,
            "--chroma": color.c.toFixed(2),
            "--hue": `${color.h.toFixed(2)}deg`,
          }}
          value={i.toString()}
        ></swatch-item>
      ))}
      {showClear ? (
        <swatch-item aria-label="Clear" className={styles.clear} value="CLEAR">
          <ClearColorIcon aria-hidden="true" />
        </swatch-item>
      ) : null}
    </swatch-select>
  );
}

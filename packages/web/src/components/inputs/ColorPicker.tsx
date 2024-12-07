import { useCallback } from "react";
import styles from "./ColorPicker.module.css";
import { classNames } from "@/utils/css";
import type SwatchSelect from "./SwatchSelect";
import type { Theme } from "@/types/pages";

export type ColorPickerValue = {
  theme: Theme;
  hue?: number;
};

interface ColorPickerProps {
  className?: string;
  direction?: "left" | "right";
  value?: ColorPickerValue;
  onChange: (value: ColorPickerValue) => void;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

const HUES: [number, string][] = [];
const NUM_HUES = 10;
const HUE_ROTATION = 20;
for (let i = 0; i < NUM_HUES; i++) {
  HUES.push([HUE_ROTATION + (i / NUM_HUES) * 360, "TODO: color name " + i]);
}
HUES.reverse();

export default function ColorPicker({
  className,
  direction,
  value,
  onChange,
  tooltipPosition,
}: ColorPickerProps) {
  const setColor = useCallback(
    (event: Event) => {
      const [theme, hue] = (event.target as SwatchSelect).value.split(":") as
        | ["DARK" | "LIGHT"]
        | ["COLOR", string];
      onChange(theme === "COLOR" ? { theme, hue: parseFloat(hue) } : { theme });
    },
    [onChange],
  );

  return (
    <swatch-select
      class={classNames(
        styles.color,
        tooltipPosition ? `tooltip-${tooltipPosition}` : undefined,
        className,
      )}
      aria-label="Color"
      aria-orientation="horizontal"
      direction={direction}
      onchange={setColor}
      value={
        value
          ? `${value.theme}${value.theme === "COLOR" ? `:${value.hue}` : ""}`
          : undefined
      }
    >
      <>
        {HUES.map(([hue, name]) => (
          <swatch-item
            key={`color-${hue}`}
            aria-label={name}
            style={
              {
                "--hue": `${hue}deg`,
              } as React.CSSProperties
            }
            value={`COLOR:${hue}`}
          ></swatch-item>
        ))}
      </>
      <swatch-item
        key="DARK"
        aria-label="Dark"
        class={styles.dark}
        value="DARK"
      ></swatch-item>
      <swatch-item
        key="LIGHT"
        aria-label="Light"
        class={styles.light}
        value="LIGHT"
      ></swatch-item>
    </swatch-select>
  );
}

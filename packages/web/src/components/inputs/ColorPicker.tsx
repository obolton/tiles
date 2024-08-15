import { useCallback, useEffect, useRef } from "react";
import styles from "./ColorPicker.module.css";
import type SwatchSelect from "./SwatchSelect";
import type { Theme } from "@/types/pages";

export type ColorPickerValue = {
  theme: Theme;
  hue?: number;
};

interface ColorPickerProps {
  className?: string;
  value?: ColorPickerValue;
  onChange: (value: ColorPickerValue) => void;
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
  value,
  onChange,
}: ColorPickerProps) {
  const ref = useRef<SwatchSelect>(null);

  const setColor = useCallback(
    async (event: Event) => {
      const value = (event.target as SwatchSelect).value;
      const [theme, hue] = value.split(":") as
        | ["DARK" | "LIGHT"]
        | ["COLOR", string];
      onChange(theme === "COLOR" ? { theme, hue: parseFloat(hue) } : { theme });
    },
    [onChange],
  );

  useEffect(() => {
    const colorSelect = ref.current;
    if (!colorSelect) {
      return;
    }
    colorSelect.addEventListener("change", setColor);
    return () => {
      colorSelect.removeEventListener("change", setColor);
    };
  }, [setColor]);

  return (
    <swatch-select
      class={`${styles.color} ${className ?? ""}`}
      ref={ref}
      aria-label="Color"
      aria-orientation="horizontal"
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

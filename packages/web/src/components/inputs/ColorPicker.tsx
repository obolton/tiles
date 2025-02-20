import { useCallback } from "react";
import clearColorIcon from "@/icons/clear-color.svg";
import styles from "./ColorPicker.module.css";
import { classNames } from "@/utils/css";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Theme } from "@/types/pages";

export type ColorPickerValue = {
  theme: Theme | null;
  hue: number | null;
};

interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "value" | "onChange"> {
  className?: string;
  direction?: "left" | "right";
  value?: ColorPickerValue;
  onChange: (value: ColorPickerValue) => void;
  showClear?: boolean;
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
  showClear = false,
  ...props
}: ColorPickerProps) {
  const setColor = useCallback(
    (event: Event) => {
      const [theme, hue] = (event.target as SwatchSelect).value.split(":") as
        | ["DARK" | "LIGHT" | "CLEAR"]
        | ["COLOR", string];
      switch (theme) {
        case "CLEAR":
          onChange({ theme: null, hue: null });
          break;
        case "COLOR":
          onChange({ theme, hue: parseFloat(hue) });
          break;
        default:
          onChange({ theme, hue: null });
          break;
      }
    },
    [onChange],
  );

  return (
    <swatch-select
      {...props}
      class={classNames(styles["color-picker"], className)}
      aria-orientation="horizontal"
      direction={direction}
      value={
        value
          ? `${value.theme}${value.theme === "COLOR" ? `:${value.hue}` : ""}`
          : undefined
      }
      onchange={setColor}
    >
      <>
        {HUES.map(([hue, name]) => (
          <swatch-item
            key={`color-${hue}`}
            aria-label={name}
            class={styles.color}
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
      {showClear ? (
        <swatch-item
          key="CLEAR"
          aria-label="Clear color"
          class={styles.clear}
          value="CLEAR"
        >
          <img src={clearColorIcon.src} alt="Clear color" />
        </swatch-item>
      ) : null}
    </swatch-select>
  );
}

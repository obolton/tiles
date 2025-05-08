import ClearColorIcon from "@/icons/clear-color.svg?jsx";
import styles from "./ColorPicker.module.css";
import { classNames } from "@/utils/css";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Theme } from "@/types/pages";
import type { JSX } from "@/jsx/jsx";

export type ColorPickerValue = {
  theme: Theme | null;
  hue: number | null;
};

interface ColorPickerProps
  extends Omit<JSX.Attributes<HTMLElement>, "value" | "onChange"> {
  className?: string;
  direction?: "left" | "right" | "up";
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

export default function ColorPicker({
  className,
  direction,
  value,
  onChange,
  showClear = false,
  ...props
}: ColorPickerProps) {
  const setColor = (event: Event) => {
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
  };

  return (
    <swatch-select
      {...props}
      className={classNames(styles["color-picker"], className)}
      aria-orientation="horizontal"
      direction={direction}
      value={
        value
          ? `${value.theme}${value.theme === "COLOR" ? `:${value.hue}` : ""}`
          : undefined
      }
      onchange={setColor}
    >
      {showClear ? (
        <swatch-item
          aria-label="Clear color"
          className={styles.clear}
          value="CLEAR"
        >
          <ClearColorIcon aria-hidden="true" />
        </swatch-item>
      ) : null}
      <swatch-item
        aria-label="Light"
        className={styles.light}
        value="LIGHT"
      ></swatch-item>
      <swatch-item
        aria-label="Dark"
        className={styles.dark}
        value="DARK"
      ></swatch-item>
      <>
        {HUES.map(([hue, name]) => (
          <swatch-item
            aria-label={name}
            className={styles.color}
            style={{
              "--hue": `${hue}deg`,
            }}
            value={`COLOR:${hue}`}
          ></swatch-item>
        ))}
      </>
    </swatch-select>
  );
}

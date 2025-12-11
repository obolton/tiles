import styles from "./ColorPalette.module.css";
import {
  getColorName,
  isSameColor,
  toCSSColor,
  formatColor,
  oklchToP3,
  type Color,
} from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";

export interface ColorPaletteProps {
  rows?: number;
  minLightness?: number;
  maxLightness?: number;
  chroma?: number;
  hues?: number;
  startHue?: number;
  value?: Reactive<Color | null | undefined>;
  onChange: (value: Color) => void;
}

export default function ColorPalette({
  rows = 5,
  minLightness = 0,
  maxLightness = 1,
  chroma = 0.2,
  hues = 10,
  startHue = 0,
  value,
  onChange,
}: ColorPaletteProps) {
  const items: {
    color: Color;
    name: string;
  }[] = [];

  for (let l = rows - 1; l >= 0; l--) {
    for (let i = 0; i < hues; i++) {
      const oklch = {
        l: (l / (rows - 1)) * (maxLightness - minLightness) + minLightness,
        c: chroma,
        h: startHue + (i / hues) * 360,
      };
      items.push({
        color: formatColor(oklchToP3(oklch)),
        name: getColorName(oklch),
      });
    }

    const grayscale = {
      l: (l / (rows - 1)) * (maxLightness - minLightness) + minLightness,
      c: 0,
      h: 0,
    };
    items.push({
      color: formatColor(oklchToP3(grayscale)),
      name: getColorName(grayscale),
    });
  }

  function setColor(event: Event) {
    if (!onChange) {
      return;
    }
    const element = event.target as HTMLInputElement;
    const value = element.value;
    const index = parseInt(value, 10);
    const color = items[index];
    if (color) {
      onChange(color.color);
    }
  }

  const selectedColor = value?.value;
  const selectedIndex = selectedColor
    ? items.findIndex((compareColor) =>
        isSameColor(compareColor.color, selectedColor),
      )
    : null;

  return (
    <fieldset className={styles.palette} on:change={setColor}>
      {items.map((item, i) => (
        <input
          type="radio"
          name="color"
          style={{
            "--color": toCSSColor(item.color),
          }}
          aria-label={item.name}
          value={i.toString()}
          checked={i === selectedIndex}
        />
      ))}
    </fieldset>
  );
}

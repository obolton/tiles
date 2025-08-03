import styles from "./ColorPalette.module.css";
import { getColorName, isSameColor, type Color } from "@/utils/color";
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
  const colors: Color[] = [];

  for (let l = rows - 1; l >= 0; l--) {
    for (let i = 0; i < hues; i++) {
      colors.push({
        l: (l / (rows - 1)) * (maxLightness - minLightness) + minLightness,
        c: chroma,
        h: startHue + (i / hues) * 360,
      });
    }

    colors.push({
      l: (l / (rows - 1)) * (maxLightness - minLightness) + minLightness,
      c: 0,
      h: 0,
    });
  }

  function setColor(event: Event) {
    if (!onChange) {
      return;
    }
    const element = event.target as HTMLInputElement;
    const value = element.value;
    const index = parseInt(value, 10);
    const color = colors[index];
    if (color) {
      onChange(color);
    }
  }

  const selectedColor = value?.value;
  const selectedIndex = selectedColor
    ? colors.findIndex((compareColor) =>
        isSameColor(compareColor, selectedColor),
      )
    : null;

  return (
    <div className={styles.palette} onchange={setColor}>
      {colors.map((color, i) => (
        <input
          type="radio"
          name="color"
          style={{
            "--lightness": `${color.l.toFixed(2)}`,
            "--chroma": color.c.toFixed(2),
            "--hue": `${color.h.toFixed(2)}deg`,
          }}
          aria-label={getColorName(color)}
          value={i.toString()}
          checked={i === selectedIndex}
        />
      ))}
    </div>
  );
}

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

export interface ThemeColor {
  name: string;
  color: Color;
}

export interface ColorPaletteProps {
  rows?: number;
  minLightness?: number;
  maxLightness?: number;
  chroma?: number;
  hues?: number;
  startHue?: number;
  themeColors?: Reactive<ThemeColor[]>;
  value?: Reactive<Color | null | undefined>;
  onChange: (value: Color) => void;
}

function preventDefault(event: Event) {
  event.preventDefault();
}

function ColorSwatch({
  color,
  name,
  checked,
  row,
}: {
  color: Color;
  name: string;
  checked: boolean;
  row?: string;
}) {
  const style: Record<string, string> = {
    "--color": toCSSColor(color),
  };
  if (row) {
    style["grid-row"] = row;
  }
  return (
    <input
      type="radio"
      name="color"
      style={style}
      aria-label={name}
      value={color}
      checked={checked}
      on:pointerdown={preventDefault}
    />
  );
}

export default function ColorPalette({
  rows = 5,
  minLightness = 0,
  maxLightness = 1,
  chroma = 0.2,
  hues = 10,
  startHue = 0,
  themeColors,
  value,
  onChange,
}: ColorPaletteProps) {
  const columns = hues + 1;
  const items: ThemeColor[] = [];

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
    const element = event.target as HTMLInputElement;
    if (element.type === "radio") {
      onChange(element.value);
    }
  }

  let fieldset: HTMLFieldSetElement | undefined;

  function ref(element: HTMLFieldSetElement) {
    fieldset = element;
  }

  value?.subscribe((reactive) => {
    if (!fieldset) {
      return;
    }
    const color = reactive.value;
    if (color == null) {
      const checked = fieldset.querySelector<HTMLInputElement>("input:checked");
      if (checked) {
        checked.checked = false;
      }
    } else {
      const input = fieldset.querySelector<HTMLInputElement>(`input[value="${color}"]`);
      if (input) {
        input.checked = true;
      }
    }
  });

  const initialColor = value?.value;

  function isChecked(color: Color) {
    return initialColor != null && isSameColor(color, initialColor);
  }

  return (
    <fieldset
      ref={ref}
      classList={{
        [styles.palette]: true,
        [styles["with-theme-colors"]]: themeColors?.derive((c) => c.length > 0),
      }}
      on:change={setColor}
    >
      {themeColors?.derive((colors) =>
        colors.map((item) => (
          <ColorSwatch
            color={item.color}
            name={item.name}
            checked={isChecked(item.color)}
            row="theme"
          />
        )),
      )}
      {items.map((item, i) =>
        themeColors ? (
          <ColorSwatch
            color={item.color}
            name={item.name}
            checked={isChecked(item.color)}
            row={`palette ${Math.floor(i / columns) + 1}`}
          />
        ) : (
          <ColorSwatch color={item.color} name={item.name} checked={isChecked(item.color)} />
        ),
      )}
    </fieldset>
  );
}

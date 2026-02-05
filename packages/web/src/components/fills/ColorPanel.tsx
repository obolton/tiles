import ColorPalette from "@/components/colors/ColorPalette";
import ColorToggle, { type ActiveColor } from "@/components/colors/ColorToggle";
import GradientPalette from "@/components/colors/GradientPalette";
import { reactive, combine, type Reactive } from "@/utils/reactivity";
import { getComplementaryColor, type Color } from "@/utils/color";
import type { ColorFill, GradientFill } from "./types";
import styles from "./ColorPanel.module.css";

const ROWS = 5;
const MIN_LIGHTNESS = 0.25;
const MAX_LIGHTNESS = 1;
const CHROMA = 0.15;
const HUES = 10;
const START_HUE = 24;

export interface ColorPanelProps {
  value: Reactive<ColorFill | GradientFill | null>;
  onChange: (value: ColorFill | GradientFill) => void;
}

export default function ColorPanel({ value, onChange }: ColorPanelProps) {
  const activeColor = reactive<ActiveColor>("A");

  const currentEditingColor = combine(
    { value, activeColor },
    ({ value, activeColor }) => {
      if (value?.type === "color") {
        return value.color;
      }
      if (value?.type === "gradient") {
        return activeColor === "A" ? value.colorA : value.colorB;
      }
      return null;
    },
  );

  function handleGradientChange(direction: GradientFill["direction"] | null) {
    const current = value.value;

    if (direction === null) {
      if (current?.type === "gradient") {
        onChange({ type: "color", color: current.colorA });
      }
      activeColor.value = "A";
      return;
    }

    if (current?.type === "color") {
      const complementary = getComplementaryColor(current.color);
      onChange({
        type: "gradient",
        colorA: current.color,
        colorB: complementary,
        direction,
      });
    } else if (current?.type === "gradient") {
      onChange({ ...current, direction });
    }
  }

  function handleColorChange(color: Color) {
    const current = value.value;

    if (current?.type === "gradient") {
      if (activeColor.value === "A") {
        onChange({ ...current, colorA: color });
      } else {
        onChange({ ...current, colorB: color });
      }
    } else {
      onChange({ type: "color", color });
    }
  }

  return (
    <div className={styles.panel}>
      <GradientPalette
        colors={value.derive((bg) => {
          if (bg?.type === "color") {
            return [bg.color];
          }
          if (bg?.type === "gradient") {
            return [bg.colorA, bg.colorB];
          }
          return [];
        })}
        value={value.derive((bg) => (bg?.type === "gradient" ? bg : null))}
        onChange={handleGradientChange}
      />

      <ColorToggle
        colorA={value.derive((fill) =>
          fill?.type === "color" ? fill.color : (fill?.colorA ?? null),
        )}
        colorB={value.derive((fill) =>
          fill?.type === "gradient" ? fill.colorB : null,
        )}
        active={activeColor}
        showB={value.derive((fill) => fill?.type === "gradient")}
        onSelect={(selected) => {
          activeColor.value = selected;
        }}
      />

      <ColorPalette
        rows={ROWS}
        minLightness={MIN_LIGHTNESS}
        maxLightness={MAX_LIGHTNESS}
        chroma={CHROMA}
        hues={HUES}
        startHue={START_HUE}
        value={currentEditingColor}
        onChange={handleColorChange}
      />
    </div>
  );
}

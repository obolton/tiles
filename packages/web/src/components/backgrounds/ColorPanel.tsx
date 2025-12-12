import ColorPalette from "@/components/colors/ColorPalette";
import ColorToggle, { type ActiveColor } from "@/components/colors/ColorToggle";
import GradientPalette from "@/components/colors/GradientPalette";
import { reactive, Computed, type Reactive } from "@/utils/reactivity";
import { getComplementaryColor, type Color } from "@/utils/color";
import type { ColorBackground, GradientBackground } from "./types";
import styles from "./ColorPanel.module.css";

const ROWS = 5;
const MIN_LIGHTNESS = 0.25;
const MAX_LIGHTNESS = 1;
const CHROMA = 0.15;
const HUES = 10;
const START_HUE = 24;

export interface ColorPanelProps {
  value: Reactive<ColorBackground | GradientBackground | null>;
  onChange: (background: ColorBackground | GradientBackground) => void;
}

export default function ColorPanel({ value, onChange }: ColorPanelProps) {
  const activeColor = reactive<ActiveColor>("A");

  const currentEditingColor = new Computed(
    [value, activeColor] as const,
    (bg, active) => {
      if (bg?.type === "color") return bg.color;
      if (bg?.type === "gradient")
        return active === "A" ? bg.colorA : bg.colorB;
      return null;
    },
  );

  function handleGradientChange(
    direction: GradientBackground["direction"] | null,
  ) {
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
          if (bg?.type === "color") return [bg.color];
          if (bg?.type === "gradient") return [bg.colorA, bg.colorB];
          return [];
        })}
        value={value.derive((bg) => (bg?.type === "gradient" ? bg : null))}
        onChange={handleGradientChange}
      />

      <ColorToggle
        colorA={value.derive((bg) =>
          bg?.type === "color" ? bg.color : (bg?.colorA ?? null),
        )}
        colorB={value.derive((bg) =>
          bg?.type === "gradient" ? bg.colorB : null,
        )}
        active={activeColor}
        showB={value.derive((bg) => bg?.type === "gradient")}
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

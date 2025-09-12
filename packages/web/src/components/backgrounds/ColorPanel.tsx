import ColorPalette from "@/components/colors/ColorPalette";
import GradientPalette from "@/components/colors/GradientPalette";
import type { Reactive } from "@/utils/reactivity";
import type { ColorBackground, GradientBackground } from "./types";

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
  return (
    <>
      <ColorPalette
        rows={ROWS}
        minLightness={MIN_LIGHTNESS}
        maxLightness={MAX_LIGHTNESS}
        chroma={CHROMA}
        hues={HUES}
        startHue={START_HUE}
        value={value.derive((background) => {
          switch (background?.type) {
            case "color":
              return background.color;
            case "gradient":
              return background.colorA;
            default:
              return null;
          }
        })}
        onChange={(color) => onChange({ type: "color", color })}
      />

      <GradientPalette
        colors={value.derive((background) => {
          switch (background?.type) {
            case "color":
              return [background.color];
            case "gradient":
              return [background.colorA, background.colorB];
            default:
              return [];
          }
        })}
        value={value.derive((background) =>
          background?.type === "gradient" ? background : null,
        )}
      />
    </>
  );
}

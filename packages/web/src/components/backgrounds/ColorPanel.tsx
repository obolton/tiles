import ColorPalette from "@/components/colors/ColorPalette";
import type { Reactive } from "@/utils/reactivity";
import type { ColorBackground } from "./types";

const ROWS = 5;
const MIN_LIGHTNESS = 0.25;
const MAX_LIGHTNESS = 1;
const CHROMA = 0.15;
const HUES = 10;
const START_HUE = 24;

export interface ColorPanelProps {
  value?: Reactive<ColorBackground | null>;
  onChange: (background: ColorBackground) => void;
}

export default function ColorPanel({ value, onChange }: ColorPanelProps) {
  return (
    <ColorPalette
      rows={ROWS}
      minLightness={MIN_LIGHTNESS}
      maxLightness={MAX_LIGHTNESS}
      chroma={CHROMA}
      hues={HUES}
      startHue={START_HUE}
      value={value?.derive((v) => v?.color)}
      onChange={(color) => onChange({ type: "color", color })}
    />
  );
}

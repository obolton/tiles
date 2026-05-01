import { formatHex } from "culori";

const HUE_STEP = 137.508;
const LIGHTNESS = 0.7;
const CHROMA = 0.15;

export function getUserColor(index: number): string {
  const hue = (index * HUE_STEP) % 360;
  return formatHex({ mode: "oklch", l: LIGHTNESS, c: CHROMA, h: hue });
}

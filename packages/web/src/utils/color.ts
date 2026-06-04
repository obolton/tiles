import { useMode, modeOklch, modeP3 } from "culori/fn";
import type { Color } from "doc/types/color";

export type { Color };

export const COLOR_HEX_REGEX = /^[0-9a-fA-F]{12}$/;

export interface P3Color {
  r: number;
  g: number;
  b: number;
}

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

const p3 = useMode(modeP3);
const oklch = useMode(modeOklch);

export function oklchToP3(color: OklchColor): P3Color {
  const result = p3({ mode: "oklch", ...color });
  return {
    r: result?.r ?? 0,
    g: result?.g ?? 0,
    b: result?.b ?? 0,
  };
}

export function p3ToOklch(color: P3Color): OklchColor {
  const result = oklch({ mode: "p3", ...color });
  return {
    l: result?.l ?? 0,
    c: result?.c ?? 0,
    h: result?.h ?? 0,
  };
}

export function parseColor(color: Color): P3Color {
  if (color.length !== 6 && color.length !== 12) {
    throw new Error(`Invalid color: ${color}`);
  }

  const channelBits = color.length === 12 ? 16 : 8;
  const channelChars = channelBits / 4;
  const channelMax = (1 << channelBits) - 1;
  const rHex = color.slice(0, channelChars);
  const gHex = color.slice(channelChars, channelChars * 2);
  const bHex = color.slice(channelChars * 2, channelChars * 3);
  const r = parseInt(rHex, 16) / channelMax;
  const g = parseInt(gHex, 16) / channelMax;
  const b = parseInt(bHex, 16) / channelMax;
  return { r, g, b };
}

export function formatColor(color: P3Color, channelBits: 8 | 16 = 16): Color {
  const channelChars = channelBits / 4;
  const channelMax = (1 << channelBits) - 1;
  const r = Math.round(Math.min(Math.max(color.r, 0), 1) * channelMax);
  const g = Math.round(Math.min(Math.max(color.g, 0), 1) * channelMax);
  const b = Math.round(Math.min(Math.max(color.b, 0), 1) * channelMax);
  const rHex = r.toString(16).padStart(channelChars, "0");
  const gHex = g.toString(16).padStart(channelChars, "0");
  const bHex = b.toString(16).padStart(channelChars, "0");
  return rHex + gHex + bHex;
}

export function toCSSColor(color: Color | P3Color) {
  const { r, g, b } = typeof color === "string" ? parseColor(color) : color;
  return `color(display-p3 ${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)})`;
}

export function isSameColor(a: Color, b: Color) {
  return a === b;
}

export function getLightnessName(l: number) {
  if (l <= 0.3) {
    return "Very Dark";
  }
  if (l < 0.5) {
    return "Dark";
  }
  if (l < 0.7) {
    return "Mid";
  }
  if (l < 0.9) {
    return "Light";
  }
  return "Very Light";
}

const HUE_RANGES = [
  { from: 0, to: 24, name: "Red" },
  { from: 24, to: 60, name: "Orange" },
  { from: 60, to: 96, name: "Yellow" },
  { from: 96, to: 132, name: "Lime" },
  { from: 132, to: 168, name: "Green" },
  { from: 168, to: 204, name: "Cyan" },
  { from: 204, to: 240, name: "Blue" },
  { from: 240, to: 276, name: "Indigo" },
  { from: 276, to: 312, name: "Violet" },
  { from: 312, to: 348, name: "Magenta" },
  { from: 348, to: 360, name: "Red" },
];

export function getHueName(color: OklchColor) {
  if (color.c < 0.05) {
    return "Gray";
  }

  const hue = color.h % 360;
  const range = HUE_RANGES.find(({ from, to }) => hue >= from && hue < to);
  if (range) {
    return range.name;
  }
  return "Unknown";
}

export function getColorName(color: OklchColor) {
  if (color.c < 0.05) {
    if (color.l >= 0.9) {
      return "White";
    }
    if (color.l <= 0.2) {
      return "Black";
    }
  }
  return `${getLightnessName(color.l)} ${getHueName(color)}`;
}

export function getComplementaryColor(color: Color): Color {
  const p3 = parseColor(color);
  const colorOklch = p3ToOklch(p3);

  // For grays (low chroma), add some chroma and pick a default hue
  if (colorOklch.c < 0.02) {
    return formatColor(
      oklchToP3({
        l: colorOklch.l,
        c: 0.1,
        h: 200,
      }),
    );
  }

  return formatColor(
    oklchToP3({
      l: colorOklch.l,
      c: colorOklch.c,
      h: (colorOklch.h + 180) % 360,
    }),
  );
}

export type Color = string;

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

export function parseColor(color: Color): OklchColor {
  if (color.length !== 6 && color.length !== 12) {
    throw new Error(`Invalid color: ${color}`);
  }

  const channelBits = color.length === 12 ? 16 : 8;
  const channelChars = channelBits / 4;
  const channelMax = (1 << channelBits) - 1;
  const lHex = color.slice(0, channelChars);
  const cHex = color.slice(channelChars, channelChars * 2);
  const hHex = color.slice(channelChars * 2, channelChars * 3);
  const l = parseInt(lHex, 16) / channelMax;
  const c = parseInt(cHex, 16) / channelMax;
  const h = (parseInt(hHex, 16) / channelMax) * 360;
  return { l, c, h };
}

export function formatColor(
  color: OklchColor,
  channelBits: 8 | 16 = 16,
): Color {
  const channelChars = channelBits / 4;
  const channelMax = (1 << channelBits) - 1;
  const l = Math.min(Math.max(color.l, 0), 1) * channelMax;
  const c = Math.min(Math.max(color.c, 0), 1) * channelMax;
  const h = ((color.h % 360) / 360) * channelMax;
  const lHex = l.toString(16).padStart(channelChars, "0");
  const cHex = c.toString(16).padStart(channelChars, "0");
  const hHex = h.toString(16).padStart(channelChars, "0");
  return lHex + cHex + hHex;
}

export function toCSSColor(color: Color | OklchColor) {
  const { l, c, h } = typeof color === "string" ? parseColor(color) : color;
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(4)}deg)`;
}

export function isSameColor(a: Color, b: Color) {
  return a === b;
}

export function isDark(color: Color) {
  const { l } = parseColor(color);
  return l < 0.5;
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

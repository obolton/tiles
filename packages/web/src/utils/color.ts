export interface Color {
  l: number;
  c: number;
  h: number;
}

export function toCSSColor({ l, c, h }: Color) {
  return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(2)}deg)`;
}

export function isSameColor(a: Color, b: Color) {
  return a.l === b.l && a.c === b.c && a.h === b.h;
}

export function isDark(color: Color) {
  return color.l < 0.5;
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

export function getHueName(color: Color) {
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

export function getColorName(color: Color) {
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

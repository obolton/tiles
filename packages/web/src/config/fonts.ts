export type FontConfig = {
  name: string;
  family: string;
  opticalSizing?: boolean;
  weights?: string;
  fallback: string;
};

export const DEFAULT_WEIGHTS = "400..700";

export const FONTS = [
  {
    name: "Modern",
    family: "Inter",
    opticalSizing: true,
    weights: "14..32,400..700",
    fallback: "sans-serif",
  },
  {
    name: "Classic",
    family: "Lora",
    fallback: "serif",
  },
  {
    name: "Code",
    family: "JetBrains Mono",
    fallback: "monospace",
  },
  {
    name: "Rounded",
    family: "Quicksand",
    fallback: "sans-serif",
  },
  {
    name: "Bubbles",
    family: "DynaPuff",
    fallback: "sans-serif",
  },
] as const satisfies FontConfig[];

export type FontFamily = (typeof FONTS)[number]["family"];

export const DEFAULT_FONT: FontFamily = "Inter";

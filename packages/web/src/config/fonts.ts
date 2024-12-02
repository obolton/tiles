export type FontConfig = {
  id: string;
  name: string;
  family: string;
  opticalSizing?: boolean;
  weights?: string;
  fallback: string;
};

export const DEFAULT_WEIGHTS = "400..700";

export const FONTS = [
  {
    id: "MODERN",
    name: "Modern",
    family: "Inter",
    opticalSizing: true,
    weights: "14..32,400..700",
    fallback: "sans-serif",
  },
  {
    id: "CLASSIC",
    name: "Classic",
    family: "Lora",
    fallback: "serif",
  },
  {
    id: "CODE",
    name: "Code",
    family: "JetBrains Mono",
    fallback: "monospace",
  },
  {
    id: "ROUNDED",
    name: "Rounded",
    family: "Quicksand",
    fallback: "sans-serif",
  },
  {
    id: "BUBBLES",
    name: "Bubbles",
    family: "DynaPuff",
    fallback: "sans-serif",
  },
] as const satisfies FontConfig[];

export type FontId = (typeof FONTS)[number]["id"];

export const DEFAULT_FONT: FontId = "MODERN";

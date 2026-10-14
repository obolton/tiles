import type { Color } from "./color";

export interface ColorFill {
  type: "color";
  color: Color;
}

export interface GradientFill {
  type: "gradient";
  colorA: Color;
  colorB: Color;
  direction: "VERTICAL" | "HORIZONTAL" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";
}

export interface ImageFill {
  type: "image";
  imageId: string;
}

export type Fill = ColorFill | GradientFill | ImageFill;

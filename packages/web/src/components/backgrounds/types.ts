import type { Color } from "@/utils/color";

export interface ColorBackground {
  type: "color";
  color: Color;
}

export interface GradientBackground {
  type: "gradient";
  colorA: Color;
  colorB: Color;
  direction: "VERTICAL" | "HORIZONTAL" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";
}

export interface ImageBackground {
  type: "image";
  imageUrl: string;
}

export interface ImageBackgroundUpdate {
  type: "image";
  imageId: string;
}

export type Background = ColorBackground | GradientBackground | ImageBackground;

export type BackgroundUpdate =
  | ColorBackground
  | GradientBackground
  | ImageBackgroundUpdate
  | null;

export type Fill = ColorBackground | GradientBackground | null;
export type FillUpdate = Fill;

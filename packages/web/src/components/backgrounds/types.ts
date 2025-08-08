import type { Color } from "@/utils/color";

export interface ColorBackground {
  type: "color";
  color: Color;
}

export interface ImageBackground {
  type: "image";
  imageKey: string;
}

export type Background = ColorBackground | ImageBackground | null;

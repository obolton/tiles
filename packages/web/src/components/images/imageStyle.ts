import { combine } from "@/utils/reactivity";
import { setSearchParams } from "@/utils/urls";
import type Image from "@/models/Image";

interface ImageVariant {
  width: number;
  searchParams: Record<string, string>;
}

export const MAX_COLUMN_WIDTH = 256;
export const COLUMN_GAP = 16;
const PIXEL_DENSITY = 2;

const VARIANTS: ImageVariant[] = [
  {
    width: MAX_COLUMN_WIDTH * PIXEL_DENSITY,
    searchParams: { class: "512w" },
  },
  {
    width: (MAX_COLUMN_WIDTH * 2 + COLUMN_GAP) * PIXEL_DENSITY,
    searchParams: { class: "1056w" },
  },
  {
    width: (MAX_COLUMN_WIDTH * 3 + COLUMN_GAP * 2) * PIXEL_DENSITY,
    searchParams: { class: "1600w" },
  },
] as const;

export function getImageSrcSet(src: string) {
  return VARIANTS.map(
    ({ width, searchParams }) =>
      `${setSearchParams(src, searchParams)} ${width}w`,
  ).join(", ");
}

export function getMaxWidth(columns: number) {
  return columns * MAX_COLUMN_WIDTH + (columns - 1) * COLUMN_GAP;
}

export function getImageStyle(image: Image) {
  return combine(
    { origin: image.origin, sizing: image.sizing },
    ({ origin, sizing }) => ({
      objectPosition: `${origin.x * 100}% ${origin.y * 100}%`,
      aspectRatio:
        sizing === "AUTO"
          ? `${image.size.value.width} / ${image.size.value.height}`
          : undefined,
    }),
  );
}

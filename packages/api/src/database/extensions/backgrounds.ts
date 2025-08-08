import { Prisma } from "@prisma/client";
import { getImageUrl } from "@/utils/cdn.ts";

export type Background =
  | { imageUrl: string }
  | { color: { l: number; c: number; h: number } }
  | null;

function compute({
  lightness,
  chroma,
  hue,
  imageKey,
}: {
  lightness: number | null;
  chroma: number | null;
  hue: number | null;
  imageKey?: string | null;
}): Background {
  if (imageKey) {
    return { imageUrl: getImageUrl(imageKey) };
  }
  if (
    typeof lightness === "number" &&
    typeof chroma === "number" &&
    typeof hue === "number"
  ) {
    return { color: { l: lightness, c: chroma, h: hue } };
  }
  return null;
}

export default Prisma.defineExtension({
  name: "backgrounds-extension",
  result: {
    page: {
      background: {
        needs: { lightness: true, chroma: true, hue: true },
        compute,
      },
    },
    textTile: {
      background: {
        needs: { lightness: true, chroma: true, hue: true, imageKey: true },
        compute,
      },
    },
    table: {
      background: {
        needs: { lightness: true, chroma: true, hue: true, imageKey: true },
        compute,
      },
    },
  },
});

import { Prisma } from "@prisma/client";
import { getImageUrl } from "@/utils/cdn.ts";

export type Background =
  | { imageUrl: string }
  | { color: { l: number; c: number; h: number } }
  | null;

function compute({
  backgroundL: l,
  backgroundC: c,
  backgroundH: h,
  backgroundImageKey: imageKey,
}: {
  backgroundL: number | null;
  backgroundC: number | null;
  backgroundH: number | null;
  backgroundImageKey?: string | null;
}): Background {
  if (imageKey) {
    return { imageUrl: getImageUrl(imageKey) };
  }
  if (typeof l === "number" && typeof c === "number" && typeof h === "number") {
    return { color: { l, c, h } };
  }
  return null;
}

export default Prisma.defineExtension({
  name: "backgrounds-extension",
  result: {
    page: {
      background: {
        needs: { lightness: true, chroma: true, hue: true },
        compute({ lightness, chroma, hue }) {
          return compute({
            backgroundL: lightness,
            backgroundC: chroma,
            backgroundH: hue,
          });
        },
      },
    },
    section: {
      background: {
        needs: {
          backgroundL: true,
          backgroundC: true,
          backgroundH: true,
          backgroundImageKey: true,
        },
        compute,
      },
    },
    textTile: {
      background: {
        needs: {
          backgroundL: true,
          backgroundC: true,
          backgroundH: true,
          backgroundImageKey: true,
        },
        compute,
      },
    },
    table: {
      background: {
        needs: {
          backgroundL: true,
          backgroundC: true,
          backgroundH: true,
          backgroundImageKey: true,
        },
        compute,
      },
    },
  },
});

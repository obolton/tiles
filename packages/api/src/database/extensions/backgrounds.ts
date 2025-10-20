import { Prisma, type GradientDirection } from "@/generated/prisma/client";
import { getImageUrl } from "@/utils/cdn.ts";

export type Background =
  | { type: "image"; imageUrl: string }
  | { type: "color"; color: { l: number; c: number; h: number } }
  | {
      type: "gradient";
      colorA: { l: number; c: number; h: number } | null;
      colorB: { l: number; c: number; h: number } | null;
      direction: GradientDirection;
    }
  | null;

function compute({
  backgroundL: l,
  backgroundC: c,
  backgroundH: h,
  backgroundBL: bl,
  backgroundBC: bc,
  backgroundBH: bh,
  backgroundGradient: gradient,
  backgroundImageId: imageId,
}: {
  backgroundL: number | null;
  backgroundC: number | null;
  backgroundH: number | null;
  backgroundBL?: number | null;
  backgroundBC?: number | null;
  backgroundBH?: number | null;
  backgroundGradient?: GradientDirection | null;
  backgroundImageId?: string | null;
}): Background {
  if (imageId) {
    return { type: "image", imageUrl: getImageUrl(imageId) };
  }

  if (gradient) {
    const colorA =
      typeof l === "number" && typeof c === "number" && typeof h === "number"
        ? { l, c, h }
        : null;
    const colorB =
      typeof bl === "number" && typeof bc === "number" && typeof bh === "number"
        ? { l: bl, c: bc, h: bh }
        : null;
    return {
      type: "gradient",
      colorA,
      colorB,
      direction: gradient,
    };
  }

  if (typeof l === "number" && typeof c === "number" && typeof h === "number") {
    return { type: "color", color: { l, c, h } };
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
          backgroundBL: true,
          backgroundBC: true,
          backgroundBH: true,
          backgroundGradient: true,
          backgroundImageId: true,
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
          backgroundBL: true,
          backgroundBC: true,
          backgroundBH: true,
          backgroundGradient: true,
          backgroundImageId: true,
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
          backgroundBL: true,
          backgroundBC: true,
          backgroundBH: true,
          backgroundGradient: true,
          backgroundImageId: true,
        },
        compute,
      },
    },
    chart: {
      background: {
        needs: {
          backgroundL: true,
          backgroundC: true,
          backgroundH: true,
          backgroundBL: true,
          backgroundBC: true,
          backgroundBH: true,
          backgroundGradient: true,
          backgroundImageId: true,
        },
        compute,
      },
    },
  },
});

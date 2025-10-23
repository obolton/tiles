import { Buffer } from "node:buffer";
import { Prisma, type GradientDirection } from "@/generated/prisma/client";
import { getImageUrl } from "@/utils/cdn.ts";

export type Background =
  | { type: "image"; imageUrl: string }
  | { type: "color"; color: string }
  | {
      type: "gradient";
      colorA: string;
      colorB: string;
      direction: GradientDirection;
    }
  | null;

function compute({
  backgroundColor: color,
  backgroundGradient: gradient,
  backgroundImageId: imageId,
}: {
  backgroundColor: Uint8Array | null;
  backgroundGradient?: GradientDirection | null;
  backgroundImageId?: string | null;
}): Background {
  if (imageId) {
    return { type: "image", imageUrl: getImageUrl(imageId) };
  }

  if (gradient && color?.length === 12) {
    const colorA = Buffer.from(color.subarray(0, 6)).toString("hex");
    const colorB = Buffer.from(color.subarray(6, 12)).toString("hex");
    return {
      type: "gradient",
      colorA,
      colorB,
      direction: gradient,
    };
  }

  if (color) {
    return {
      type: "color",
      color: Buffer.from(color.subarray(0, 6)).toString("hex"),
    };
  }

  return null;
}

export default Prisma.defineExtension({
  name: "backgrounds-extension",
  result: {
    page: {
      background: {
        needs: { backgroundColor: true },
        compute,
      },
    },
    section: {
      background: {
        needs: {
          backgroundColor: true,
          backgroundGradient: true,
          backgroundImageId: true,
        },
        compute,
      },
    },
    textTile: {
      background: {
        needs: {
          backgroundColor: true,
          backgroundGradient: true,
          backgroundImageId: true,
        },
        compute,
      },
    },
    table: {
      background: {
        needs: {
          backgroundColor: true,
          backgroundGradient: true,
          backgroundImageId: true,
        },
        compute,
      },
    },
    chart: {
      background: {
        needs: {
          backgroundColor: true,
          backgroundGradient: true,
          backgroundImageId: true,
        },
        compute,
      },
    },
  },
});

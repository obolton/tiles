import { Buffer } from "node:buffer";
import { Prisma, type GradientDirection } from "@/generated/prisma/client";

export type Background =
  | { type: "image"; imageId: string }
  | { type: "color"; color: string }
  | {
      type: "gradient";
      colorA: string;
      colorB: string;
      direction: GradientDirection;
    }
  | null;

export type Fill = Exclude<Background, { type: "image" }>;

function toHex(bytes: Uint8Array, start: number, end: number): string {
  return Buffer.from(bytes.subarray(start, end)).toString("hex");
}

function computeFill({
  color,
  gradient,
}: {
  color: Uint8Array | null;
  gradient?: GradientDirection | null;
}): Fill {
  if (gradient && color?.length === 12) {
    return {
      type: "gradient",
      colorA: toHex(color, 0, 6),
      colorB: toHex(color, 6, 12),
      direction: gradient,
    };
  }

  if (color) {
    return {
      type: "color",
      color: toHex(color, 0, 6),
    };
  }

  return null;
}

function computeBackground({
  backgroundColor,
  backgroundGradient,
  backgroundImageId,
}: {
  backgroundColor: Uint8Array | null;
  backgroundGradient?: GradientDirection | null;
  backgroundImageId?: string | null;
}): Background {
  if (backgroundImageId) {
    return { type: "image", imageId: backgroundImageId };
  }
  return computeFill({ color: backgroundColor, gradient: backgroundGradient });
}

export default Prisma.defineExtension({
  name: "backgrounds-extension",
  result: {
    page: {
      background: {
        needs: { backgroundColor: true },
        compute: computeBackground,
      },
    },
    theme: {
      background: {
        needs: { backgroundColor: true, backgroundGradient: true },
        compute: ({ backgroundColor, backgroundGradient }) =>
          computeFill({
            color: backgroundColor,
            gradient: backgroundGradient,
          }),
      },
    },
  },
});

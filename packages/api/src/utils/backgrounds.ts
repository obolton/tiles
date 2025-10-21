import { Buffer } from "node:buffer";
import type { GradientDirection } from "@/generated/prisma/client";
import type { BackgroundSchema } from "@/schema/Background";

export interface Background {
  backgroundColor: Uint8Array | null;
  backgroundGradient: GradientDirection | null;
  backgroundImageId: string | null;
}

export function getBackgroundProperties(
  background?: BackgroundSchema,
): Background | undefined {
  if (typeof background === "undefined") {
    return undefined;
  }

  if (background === null) {
    return {
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: null,
    };
  }

  if (background.type === "color") {
    return {
      backgroundColor: new Uint8Array(Buffer.from(background.color, "hex")),
      backgroundGradient: null,
      backgroundImageId: null,
    };
  }

  if (background.type === "gradient") {
    const { colorA, colorB } = background;
    return {
      backgroundColor: new Uint8Array(Buffer.from(colorA + colorB, "hex")),
      backgroundGradient: background.direction,
      backgroundImageId: null,
    };
  }

  if (background.type === "image") {
    return {
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: background.imageId,
    };
  }

  throw new Error("Invalid background");
}

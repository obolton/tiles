import type { GradientDirection } from "@/generated/prisma/client";
import type { BackgroundSchema } from "@/schema/Background";
import { fromHex } from "./arrays";

export interface Background {
  backgroundColor: Uint8Array<ArrayBuffer> | null;
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
      backgroundColor: fromHex(background.color),
      backgroundGradient: null,
      backgroundImageId: null,
    };
  }

  if (background.type === "gradient") {
    return {
      backgroundColor: fromHex(background.colorA + background.colorB),
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

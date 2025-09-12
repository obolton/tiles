import type { GradientDirection } from "@prisma/client";
import type { BackgroundSchema } from "@/schema/Background.ts";

export interface Background {
  backgroundL: number | null;
  backgroundC: number | null;
  backgroundH: number | null;
  backgroundBL: number | null;
  backgroundBC: number | null;
  backgroundBH: number | null;
  backgroundGradient: GradientDirection | null;
  backgroundImageKey: string | null;
}

export function getBackgroundProperties(
  background?: BackgroundSchema,
): Background | undefined {
  if (typeof background === "undefined") {
    return undefined;
  }

  if (background === null) {
    return {
      backgroundL: null,
      backgroundC: null,
      backgroundH: null,
      backgroundBL: null,
      backgroundBC: null,
      backgroundBH: null,
      backgroundGradient: null,
      backgroundImageKey: null,
    };
  }

  if (background.type === "color") {
    return {
      backgroundL: background.color.l,
      backgroundC: background.color.c,
      backgroundH: background.color.h,
      backgroundBL: null,
      backgroundBC: null,
      backgroundBH: null,
      backgroundGradient: null,
      backgroundImageKey: null,
    };
  }

  if (background.type === "gradient") {
    const { colorA, colorB } = background;
    return {
      backgroundL: colorA?.l ?? null,
      backgroundC: colorA?.c ?? null,
      backgroundH: colorA?.h ?? null,
      backgroundBL: colorB?.l ?? null,
      backgroundBC: colorB?.c ?? null,
      backgroundBH: colorB?.h ?? null,
      backgroundGradient: background.direction,
      backgroundImageKey: null,
    };
  }

  if (background.type === "image") {
    return {
      backgroundL: null,
      backgroundC: null,
      backgroundH: null,
      backgroundBL: null,
      backgroundBC: null,
      backgroundBH: null,
      backgroundGradient: null,
      backgroundImageKey: background.imageKey,
    };
  }

  throw new Error("Invalid background");
}

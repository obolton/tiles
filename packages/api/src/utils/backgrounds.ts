import type { BackgroundSchema } from "@/schema/Background.ts";

export interface Background {
  backgroundL: number | null;
  backgroundC: number | null;
  backgroundH: number | null;
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
      backgroundImageKey: null,
    };
  }

  if ("color" in background) {
    return {
      backgroundL: background.color.l,
      backgroundC: background.color.c,
      backgroundH: background.color.h,
      backgroundImageKey: null,
    };
  }

  if ("imageKey" in background) {
    return {
      backgroundL: null,
      backgroundC: null,
      backgroundH: null,
      backgroundImageKey: background.imageKey,
    };
  }

  throw new Error("Invalid background");
}

import { toCSSColor, type Color } from "@/utils/color";
import { getImageUrl } from "@/utils/images";
import type { Fill, GradientFill } from "@/components/fills/types";

const GRADIENT_DIRECTIONS: Record<GradientFill["direction"], string> = {
  VERTICAL: "to bottom",
  HORIZONTAL: "to right",
  BOTTOM_RIGHT: "to bottom right",
  BOTTOM_LEFT: "to bottom left",
};

/** The colour of a fill, or the first colour of a gradient. Image fills have none. */
export function getBackgroundColor(fill: Fill): Color | null {
  switch (fill.type) {
    case "color":
      return fill.color;
    case "gradient":
      return fill.colorA;
    case "image":
      return null;
  }
}

/** The fill as a CSS `background-image` value. */
export function getBackgroundImage(fill: Fill): string {
  switch (fill.type) {
    case "color":
      return "none";
    case "gradient": {
      const direction = GRADIENT_DIRECTIONS[fill.direction];
      return `linear-gradient(${direction} in oklch, ${toCSSColor(fill.colorA)}, ${toCSSColor(fill.colorB)})`;
    }
    case "image":
      return `url(${getImageUrl(fill.imageId)})`;
  }
}

export function getBackgroundStyle(background: Fill | null | undefined) {
  switch (background?.type) {
    case "color":
      return { background: toCSSColor(background.color) };
    case "gradient":
      return { background: getBackgroundImage(background) };
    case "image":
      return { background: `${getBackgroundImage(background)} center / cover` };
  }
}

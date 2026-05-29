import { toCSSColor } from "@/utils/color";
import { getImageUrl } from "@/utils/images";
import type { Fill, GradientFill } from "@/components/fills/types";

const GRADIENT_DIRECTIONS: Record<GradientFill["direction"], string> = {
  VERTICAL: "to bottom",
  HORIZONTAL: "to right",
  BOTTOM_RIGHT: "to bottom right",
  BOTTOM_LEFT: "to bottom left",
};

export function getBackgroundStyle(background: Fill | null | undefined) {
  switch (background?.type) {
    case "color":
      return { background: toCSSColor(background.color) };
    case "gradient": {
      const direction = GRADIENT_DIRECTIONS[background.direction];
      const colorA = toCSSColor(background.colorA);
      const colorB = toCSSColor(background.colorB);
      return {
        background: `linear-gradient(${direction} in oklch, ${colorA}, ${colorB})`,
      };
    }
    case "image":
      return {
        background: `url(${getImageUrl(background.imageId)}) center / cover`,
      };
  }
}

import { toCSSColor } from "@/utils/color";

export type GradientDirection = "VERTICAL" | "HORIZONTAL" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";

const GRADIENT_COORDS: Record<
  GradientDirection,
  { x1: string; y1: string; x2: string; y2: string }
> = {
  VERTICAL: { x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
  HORIZONTAL: { x1: "0%", y1: "0%", x2: "100%", y2: "0%" },
  BOTTOM_RIGHT: { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
  BOTTOM_LEFT: { x1: "100%", y1: "0%", x2: "0%", y2: "100%" },
};

export function createSVGGradient(
  id: string,
  colors: string[],
  direction: GradientDirection,
): SVGLinearGradientElement {
  if (colors.length < 2) {
    throw new Error("Gradient requires at least two colors");
  }

  const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  gradient.id = id;
  const coords = GRADIENT_COORDS[direction];
  gradient.setAttribute("x1", coords.x1);
  gradient.setAttribute("y1", coords.y1);
  gradient.setAttribute("x2", coords.x2);
  gradient.setAttribute("y2", coords.y2);

  for (const [i, color] of colors.entries()) {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    const offset = ((i / (colors.length - 1)) * 100).toFixed(3);
    stop.setAttribute("offset", `${offset}%`);
    stop.setAttribute("stop-color", toCSSColor(color));
    gradient.appendChild(stop);
  }

  return gradient;
}

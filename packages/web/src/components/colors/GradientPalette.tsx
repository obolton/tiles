import { toCSSColor, type Color } from "@/utils/color";
import styles from "./GradientPalette.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { StyleDeclaration } from "@/jsx/html-attributes";
import type { GradientBackground } from "@/components/backgrounds/types";

export interface GradientPaletteProps {
  colors: Reactive<(Color | null)[]>;
  value: Reactive<GradientBackground | null>;
}

export interface SolidColor {
  type: "none";
  description: string;
  direction: null;
}

export interface LinearGradient {
  type: "linear";
  description: string;
  direction: GradientBackground["direction"];
}

export type Gradient = SolidColor | LinearGradient;

const GRADIENTS: readonly Gradient[] = [
  { type: "none", description: "Solid color", direction: null },
  { type: "linear", direction: "VERTICAL", description: "Vertical gradient" },
  {
    type: "linear",
    direction: "HORIZONTAL",
    description: "Horizontal gradient",
  },
  {
    type: "linear",
    direction: "BOTTOM_RIGHT",
    description: "Diagonal gradient from top left to bottom right",
  },
  {
    type: "linear",
    direction: "BOTTOM_LEFT",
    description: "Diagonal gradient from top right to bottom left",
  },
];

function getCSSDirection(direction: GradientBackground["direction"]) {
  switch (direction) {
    case "VERTICAL":
      return "to bottom";
    case "HORIZONTAL":
      return "to right";
    case "BOTTOM_RIGHT":
      return "to bottom right";
    case "BOTTOM_LEFT":
      return "to bottom left";
  }
}

function getItemStyles(
  gradient: Gradient,
  colors: Reactive<(Color | null)[]>,
): Reactive<StyleDeclaration> | StyleDeclaration {
  switch (gradient.type) {
    case "none":
      return colors.derive((colors) => ({
        background: colors[0] ? toCSSColor(colors[0]) : "transparent",
      }));
    case "linear":
      return colors.derive(([colorA, colorB]) => {
        const direction = getCSSDirection(gradient.direction);
        const a = colorA ? toCSSColor(colorA) : "transparent";
        const b = colorB ? toCSSColor(colorB) : "transparent";
        return {
          background: `linear-gradient(${direction} in oklch, ${a}, ${b})`,
        };
      });
    default:
      return {};
  }
}

export default function GradientPalette({
  colors,
  value,
}: GradientPaletteProps) {
  return (
    <fieldset className={styles.gradients}>
      {GRADIENTS.map((gradient, i) => (
        <input
          type="radio"
          name="gradient"
          style={getItemStyles(gradient, colors)}
          aria-label={gradient.description}
          value={i.toString()}
          checked={gradient.direction === value.value?.direction}
        />
      ))}
    </fieldset>
  );
}

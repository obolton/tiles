import { toCSSColor, type Color } from "@/utils/color";
import { Computed } from "@/utils/reactivity";
import styles from "./GradientPalette.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { JSX } from "@/jsx/jsx";

export interface GradientPaletteProps {
  colorA: Reactive<Color | null>;
  colorB: Reactive<Color | null>;
}

export interface SolidColor {
  type: "none";
  description: string;
}

export interface LinearGradient {
  type: "linear";
  direction: string | number;
  description: string;
}

export type Gradient = SolidColor | LinearGradient;

const GRADIENTS: readonly Gradient[] = [
  { type: "none", description: "Solid color" },
  { type: "linear", direction: "to bottom", description: "Vertical gradient" },
  {
    type: "linear",
    direction: "to right",
    description: "Horizontal gradient",
  },
  {
    type: "linear",
    direction: "to bottom right",
    description: "Diagonal gradient from top left to bottom right",
  },
  {
    type: "linear",
    direction: "to bottom left",
    description: "Diagonal gradient from top right to bottom left",
  },
];

function getItemStyles(
  gradient: Gradient,
  colorA: Reactive<Color | null>,
  colorB: Reactive<Color | null>,
): Reactive<JSX.StyleDeclaration> | JSX.StyleDeclaration {
  switch (gradient.type) {
    case "none":
      return colorA.derive((color) => ({
        background: color ? toCSSColor(color) : "transparent",
      }));
    case "linear":
      return new Computed(
        [colorA, colorB] as const,
        (colorAValue, colorBValue) => {
          const { direction } = gradient;
          const angle =
            typeof direction === "number"
              ? direction.toFixed(2) + "deg"
              : direction;
          const a = colorAValue ? toCSSColor(colorAValue) : "transparent";
          const b = colorBValue ? toCSSColor(colorBValue) : "transparent";
          return {
            background: `linear-gradient(${angle} in oklch, ${a}, ${b})`,
          };
        },
      );
    default:
      return {};
  }
}

export default function GradientPalette({
  colorA,
  colorB,
}: GradientPaletteProps) {
  return (
    <fieldset className={styles.gradients}>
      {GRADIENTS.map((gradient, i) => (
        <input
          type="radio"
          name="gradient"
          style={getItemStyles(gradient, colorA, colorB)}
          aria-label={gradient.description}
          value={i.toString()}
        />
      ))}
    </fieldset>
  );
}

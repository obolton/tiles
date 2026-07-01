import { toCSSColor, type Color } from "@/utils/color";
import styles from "./GradientPalette.module.css";
import type { Reactive } from "@/utils/reactivity";
import type { StyleDeclaration } from "@/jsx/html-attributes";
import type { GradientFill } from "@/components/fills/types";

export interface GradientPaletteProps {
  colors: Reactive<(Color | null)[]>;
  value: Reactive<GradientFill | null>;
  onChange: (direction: GradientFill["direction"] | null) => void;
}

export interface SolidColor {
  type: "none";
  description: string;
  direction: null;
}

export interface LinearGradient {
  type: "linear";
  description: string;
  direction: GradientFill["direction"];
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

function getItemStyles(colors: Reactive<(Color | null)[]>): Reactive<StyleDeclaration> {
  return colors.derive(([colorA, colorB]) => ({
    "--color-a": colorA ? toCSSColor(colorA) : "transparent",
    "--color-b": colorB ? toCSSColor(colorB) : "transparent",
  }));
}

export default function GradientPalette({ colors, value, onChange }: GradientPaletteProps) {
  function handleChange(event: Event) {
    const element = event.target as HTMLInputElement;
    const index = parseInt(element.value, 10);
    const gradient = GRADIENTS[index];
    if (gradient) {
      onChange(gradient.direction);
    }
  }

  const colorStyles = getItemStyles(colors);

  return (
    <fieldset className={styles.gradients} on:change={handleChange}>
      {GRADIENTS.map((gradient, i) => (
        <input
          type="radio"
          name="gradient"
          className={gradient.type === "none" ? styles.solid : styles.linear}
          style={colorStyles}
          data-direction={gradient.direction}
          aria-label={gradient.description}
          value={i.toString()}
          checked={value.derive((v) => gradient.direction === (v?.direction ?? null))}
        />
      ))}
    </fieldset>
  );
}

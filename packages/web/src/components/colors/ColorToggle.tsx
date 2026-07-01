import If from "@/jsx/if";
import { toCSSColor, type Color } from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";
import styles from "./ColorToggle.module.css";

export type ActiveColor = "A" | "B";

export interface ColorToggleProps {
  colorA: Reactive<Color | null>;
  colorB: Reactive<Color | null>;
  active: Reactive<ActiveColor>;
  showB: Reactive<boolean>;
  onSelect: (color: ActiveColor) => void;
}

export default function ColorToggle({ colorA, colorB, active, showB, onSelect }: ColorToggleProps) {
  function handleChange(event: Event) {
    const element = event.target as HTMLInputElement;
    onSelect(element.value as ActiveColor);
  }

  return (
    <fieldset
      className={styles.toggle}
      role="radiogroup"
      aria-label="Select color to edit"
      on:change={handleChange}
    >
      <input
        type="radio"
        name="active-color"
        className={styles.swatch}
        style={colorA.derive((c) => ({
          "--color": c ? toCSSColor(c) : "transparent",
        }))}
        checked={active.derive((a) => a === "A")}
        value="A"
        aria-label="Edit first color"
      />

      <If condition={showB}>
        <input
          type="radio"
          name="active-color"
          className={styles.swatch}
          style={colorB.derive((c) => ({
            "--color": c ? toCSSColor(c) : "transparent",
          }))}
          checked={active.derive((a) => a === "B")}
          value="B"
          aria-label="Edit second color"
        />
      </If>
    </fieldset>
  );
}

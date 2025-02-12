import { FONTS, type FontId } from "@/config/fonts";
import fontIcon from "@/icons/font.svg";
import { useCallback } from "react";
import styles from "./FontPicker.module.css";
import type SwatchSelect from "./SwatchSelect";

interface FontPickerProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "value" | "onChange"> {
  direction?: "left" | "right";
  value?: FontId;
  onChange: (value: FontId) => void;
}

export default function FontPicker({
  direction,
  value,
  onChange,
  ...props
}: FontPickerProps) {
  const setFont = useCallback(
    (event: Event) =>
      void onChange((event.target as SwatchSelect).value as FontId),
    [onChange],
  );

  return (
    <swatch-select
      {...props}
      class={styles.font}
      aria-orientation="horizontal"
      direction={direction}
      value={value}
      onchange={setFont}
    >
      <img src={fontIcon.src} alt="Font" aria-hidden="true" slot="icon" />
      {FONTS.map((font) => (
        <swatch-item
          key={font.family}
          style={{ fontFamily: font.family }}
          value={font.id}
        >
          {font.name}
        </swatch-item>
      ))}
    </swatch-select>
  );
}

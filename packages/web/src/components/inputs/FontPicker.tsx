import { useCallback, useEffect, useRef } from "react";
import type SwatchSelect from "./SwatchSelect";
import fontIcon from "@/icons/font.svg";
import styles from "./FontPicker.module.css";

export type FontPickerValue = "SANS_SERIF" | "SERIF" | "MONOSPACE";

interface FontPickerProps {
  direction?: "left" | "right";
  value?: FontPickerValue;
  onChange: (value: FontPickerValue) => void;
}

export default function FontPicker({
  direction,
  value,
  onChange,
}: FontPickerProps) {
  const fontSelectRef = useRef<SwatchSelect>(null);

  const setFont = useCallback(
    async (event: Event) => {
      const value = (event.target as SwatchSelect).value as FontPickerValue;
      onChange(value);
    },
    [onChange],
  );

  useEffect(() => {
    const fontSelect = fontSelectRef.current;
    if (!fontSelect) {
      return;
    }
    fontSelect.addEventListener("change", setFont);
    return () => {
      fontSelect.removeEventListener("change", setFont);
    };
  }, [setFont]);

  return (
    <swatch-select
      class={`${styles.font} tooltip`}
      ref={fontSelectRef}
      aria-label="Font"
      aria-orientation="horizontal"
      direction={direction}
      value={value}
    >
      <img src={fontIcon.src} alt="Font" aria-hidden="true" slot="icon" />
      <swatch-item
        aria-label="Code font"
        value="MONOSPACE"
        data-font="MONOSPACE"
      >
        Code
      </swatch-item>
      <swatch-item aria-label="Classic font" value="SERIF" data-font="SERIF">
        Classic
      </swatch-item>
      <swatch-item
        aria-label="Modern font"
        value="SANS_SERIF"
        data-font="SANS_SERIF"
      >
        Modern
      </swatch-item>
    </swatch-select>
  );
}

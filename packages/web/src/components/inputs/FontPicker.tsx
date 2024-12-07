import { FONTS, type FontId } from "@/config/fonts";
import fontIcon from "@/icons/font.svg";
import { getGoogleFontUrlAllFonts } from "@/utils/fonts";
import { useCallback } from "react";
import styles from "./FontPicker.module.css";
import type SwatchSelect from "./SwatchSelect";
import { classNames } from "@/utils/css";

interface FontPickerProps {
  direction?: "left" | "right";
  value?: FontId;
  onChange: (value: FontId) => void;
  tooltipPosition?: "top" | "right" | "bottom" | "left";
}

export default function FontPicker({
  direction,
  value,
  onChange,
  tooltipPosition,
}: FontPickerProps) {
  const setFont = useCallback(
    (event: Event) =>
      void onChange((event.target as SwatchSelect).value as FontId),
    [onChange],
  );

  const onToggle = useCallback(() => {
    if (document.getElementById("all-fonts")) {
      return;
    }
    const link = document.createElement("link");
    link.id = "all-fonts";
    link.rel = "stylesheet";
    link.href = getGoogleFontUrlAllFonts();
    document.head.appendChild(link);
  }, []);

  return (
    <swatch-select
      class={classNames(
        styles.font,
        tooltipPosition ? `tooltip-${tooltipPosition}` : undefined,
      )}
      aria-label="Font"
      aria-orientation="horizontal"
      direction={direction}
      value={value}
      onchange={setFont}
      ontoggle={onToggle}
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

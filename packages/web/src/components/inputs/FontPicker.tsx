import { FONTS, type FontId } from "@/config/fonts";
import fontIcon from "@/icons/font.svg";
import { getGoogleFontUrlAllFonts } from "@/utils/fonts";
import { useCallback, useEffect, useRef } from "react";
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
  const fontSelectRef = useRef<SwatchSelect>(null);

  const setFont = useCallback(
    async (event: Event) => {
      const value = (event.target as SwatchSelect).value as FontId;
      onChange(value);
    },
    [onChange],
  );

  useEffect(() => {
    const fontSelect = fontSelectRef.current;
    if (!fontSelect) {
      return;
    }
    const abortController = new AbortController();
    fontSelect.addEventListener("change", setFont, {
      signal: abortController.signal,
    });
    fontSelect.addEventListener(
      "toggle",
      () => {
        if (document.getElementById("all-fonts")) {
          return;
        }
        const link = document.createElement("link");
        link.id = "all-fonts";
        link.rel = "stylesheet";
        link.href = getGoogleFontUrlAllFonts();
        document.head.appendChild(link);
      },
      {
        signal: abortController.signal,
      },
    );
    return () => abortController.abort();
  }, [setFont]);

  return (
    <swatch-select
      class={classNames(
        styles.font,
        tooltipPosition ? `tooltip-${tooltipPosition}` : undefined,
      )}
      ref={fontSelectRef}
      aria-label="Font"
      aria-orientation="horizontal"
      direction={direction}
      value={value}
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

import { FONTS, type FontFamily } from "@/config/fonts";
import fontIcon from "@/icons/font.svg";
import { getGoogleFontUrlAllFonts } from "@/utils/fonts";
import { useCallback, useEffect, useRef } from "react";
import styles from "./FontPicker.module.css";
import type SwatchSelect from "./SwatchSelect";

interface FontPickerProps {
  direction?: "left" | "right";
  value?: FontFamily;
  onChange: (value: FontFamily) => void;
}

export default function FontPicker({
  direction,
  value,
  onChange,
}: FontPickerProps) {
  const fontSelectRef = useRef<SwatchSelect>(null);

  const setFont = useCallback(
    async (event: Event) => {
      const value = (event.target as SwatchSelect).value as FontFamily;
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
      class={`${styles.font} tooltip`}
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
          value={font.family}
        >
          {font.name}
        </swatch-item>
      ))}
    </swatch-select>
  );
}

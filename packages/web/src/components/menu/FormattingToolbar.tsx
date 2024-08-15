import { useCallback, useEffect, useRef } from "react";
import ColorPicker from "@/components/inputs/ColorPicker";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import styles from "./FormattingToolbar.module.css";
import fontIcon from "@/icons/font.svg";
import type SwatchSelect from "@/components/inputs/SwatchSelect";

interface FormattingToolbarProps {
  pageId: string;
}

export default function FormattingToolbar({ pageId }: FormattingToolbarProps) {
  const isEditable = useEditable();
  const fontSelectRef = useRef<SwatchSelect>(null);

  const setFont = useCallback(
    async (event: Event) => {
      const value = (event.target as SwatchSelect).value as
        | "SANS_SERIF"
        | "SERIF"
        | "MONOSPACE";
      document.body.dataset.font = value;
      await client.pages.update.mutate({
        id: pageId,
        font: value,
      });
    },
    [pageId],
  );

  const setColor = useCallback(
    async ({ theme, hue }: ColorPickerValue) => {
      switch (theme) {
        case "LIGHT":
          document.body.classList.add("light");
          document.body.classList.remove("dark");
          document.body.classList.remove("color");
          document.body.style.removeProperty("--page-hue");
          break;

        case "DARK":
          document.body.classList.add("dark");
          document.body.classList.remove("light");
          document.body.classList.remove("color");
          document.body.style.removeProperty("--page-hue");
          break;

        case "COLOR":
          document.body.classList.add("color");
          document.body.classList.remove("light");
          document.body.classList.remove("dark");
          document.body.style.setProperty("--page-hue", `${hue}deg`);
          break;
      }
      await client.pages.update.mutate({
        id: pageId,
        theme,
        hue,
      });
    },
    [pageId],
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
  }, [isEditable, setFont]);

  if (!isEditable) {
    return null;
  }

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="Formatting tools"
      aria-orientation="vertical"
    >
      <swatch-select
        class={styles.font}
        ref={fontSelectRef}
        aria-label="Font"
        aria-orientation="horizontal"
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

      <ColorPicker onChange={setColor} />
    </div>
  );
}

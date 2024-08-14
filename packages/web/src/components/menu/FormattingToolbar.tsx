import { useCallback, useEffect, useRef } from "react";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import styles from "./FormattingToolbar.module.css";
import fontIcon from "@/icons/font.svg";
import type SwatchSelect from "../inputs/SwatchSelect";

interface FormattingToolbarProps {
  pageId: string;
}

const HUES: [number, string][] = [];
const NUM_HUES = 10;
const HUE_ROTATION = 20;
for (let i = 0; i < NUM_HUES; i++) {
  HUES.push([HUE_ROTATION + (i / NUM_HUES) * 360, "TODO: color name " + i]);
}
HUES.reverse();

export default function FormattingToolbar({ pageId }: FormattingToolbarProps) {
  const isEditable = useEditable();
  const fontSelectRef = useRef<SwatchSelect>(null);
  const colorSelectRef = useRef<SwatchSelect>(null);

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
    async (event: Event) => {
      const hue = parseFloat((event.target as SwatchSelect).value);
      document.body.style.setProperty("--page-hue", `${hue.toFixed(2)}deg`);
      document.body.classList.add("color");
      await client.pages.update.mutate({
        id: pageId,
        hue,
      });
    },
    [pageId],
  );

  useEffect(() => {
    const fontSelect = fontSelectRef.current;
    const colorSelect = colorSelectRef.current;
    if (!fontSelect || !colorSelect) {
      return;
    }
    fontSelect.addEventListener("change", setFont);
    colorSelect.addEventListener("change", setColor);
    return () => {
      fontSelect.removeEventListener("change", setFont);
      colorSelect.removeEventListener("change", setColor);
    };
  }, [isEditable, setColor, setFont]);

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

      <swatch-select
        class={styles.color}
        ref={colorSelectRef}
        aria-label="Color"
        aria-orientation="horizontal"
      >
        {HUES.map(([hue, name]) => (
          <swatch-item
            key={`color-${hue}`}
            aria-label={name}
            style={
              {
                "--hue": `${hue}deg`,
              } as React.CSSProperties
            }
            value={String(hue)}
          ></swatch-item>
        ))}
      </swatch-select>
    </div>
  );
}

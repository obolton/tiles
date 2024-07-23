import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/icons/Icon";
import deleteIcon from "@/icons/delete.svg";
import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
  className?: string;
  value?: number | null;
  onChange: (hue: number) => void;
}

const HUES: [number, string][] = [];
const NUM_HUES = 10;
const HUE_ROTATION = 20;
for (let i = 0; i < NUM_HUES; i++) {
  HUES.push([HUE_ROTATION + (i / NUM_HUES) * 360, "TODO: color name " + i]);
}
HUES.reverse();

export default function ColorPicker({
  className,
  value,
  onChange,
}: ColorPickerProps) {
  const swatchRef = useRef<HTMLOListElement>(null);
  const [isVisible, setVisible] = useState(false);
  const [isHiding, setHiding] = useState(false);
  const toggle = useCallback(() => {
    if (isVisible) {
      setHiding(true);
    } else {
      setVisible(true);
    }
  }, [isVisible]);

  const selectColor = useCallback(
    (event: React.MouseEvent<HTMLLIElement>) => {
      const hue = event.currentTarget.dataset.hue;
      if (typeof hue !== "string") {
        return;
      }
      onChange(parseInt(hue, 10));
      setHiding(true);
    },
    [onChange],
  );

  useEffect(() => {
    if (isHiding) {
      Promise.all(
        swatchRef.current
          ?.getAnimations()
          .map((animation) => animation.finished) ?? [],
      ).finally(() => {
        setHiding(false);
        setVisible(false);
      });
    }
  }, [isHiding]);

  return (
    <div className={`${styles["color-picker"]} ${className ?? ""}`}>
      <button
        className={styles.button}
        type="button"
        aria-label="Select a color"
        aria-pressed={isVisible && !isHiding}
        onClick={toggle}
      >
        <Icon src={deleteIcon.src} />
      </button>

      {isVisible ? (
        <ol
          ref={swatchRef}
          role="listbox"
          aria-orientation="horizontal"
          className={`${styles.swatch} ${isHiding ? styles.hide : ""}`}
        >
          {HUES.map(([hue, name]) => (
            <li
              key={`color-${hue}`}
              role="option"
              aria-label={name}
              aria-selected={value === hue}
              data-hue={hue}
              style={
                {
                  "--hue": `${hue}deg`,
                } as React.CSSProperties
              }
              onClick={selectColor}
            ></li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

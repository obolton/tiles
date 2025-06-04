import ColorPalette from "./ColorPalette";
import CloseIcon from "@/icons/close.svg?jsx";
import ClearColorIcon from "@/icons/clear-color.svg?jsx";
import styles from "./ColorPicker.module.css";
import { classNames } from "@/utils/css";
import type { Color } from "@/utils/color";
import type { Reactive } from "@/utils/reactivity";

export interface ColorPickerProps {
  value?: Reactive<Color | null>;
  onChange: (value: Color | null) => void;
  showClear?: boolean;
}

const ROWS = 5;
const MIN_LIGHTNESS = 0.2;
const MAX_LIGHTNESS = 1;
const CHROMA = 0.15;
const HUES = 10;
const START_HUE = 24;

export default function ColorPicker({
  value,
  onChange,
  showClear = false,
}: ColorPickerProps) {
  function clearColor() {
    onChange(null);
  }

  return (
    <>
      <button
        id="color-picker-button"
        className={classNames("floating", "small", styles.button)}
        type="button"
        popovertarget="color-picker"
        aria-label="Color"
        aria-haspopup="menu"
        aria-expanded="false"
        data-tooltip="Color"
      >
        <CloseIcon aria-hidden="true" />
      </button>

      <popover-menu
        id="color-picker"
        className={styles["color-picker"]}
        anchor="color-picker-button"
        align="center"
      >
        <ColorPalette
          rows={ROWS}
          minLightness={MIN_LIGHTNESS}
          maxLightness={MAX_LIGHTNESS}
          chroma={CHROMA}
          hues={HUES}
          startHue={START_HUE}
          value={value}
          onChange={onChange}
        />

        {showClear ? (
          <button
            type="button"
            className={classNames("floating", styles.clear)}
            aria-label="Clear"
            data-tooltip="Clear"
            onclick={clearColor}
          >
            <ClearColorIcon aria-hidden="true" />
          </button>
        ) : null}
      </popover-menu>
    </>
  );
}

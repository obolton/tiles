import { FONTS, type FontId } from "@/config/fonts";
import FontIcon from "@/icons/font.svg?jsx";
import styles from "./FontPicker.module.css";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";

interface FontPickerProps
  extends Omit<JSX.Attributes<HTMLElement>, "value" | "onChange"> {
  direction?: "left" | "right" | "up";
  value?: FontId;
  onChange: (value: FontId) => void;
}

export default function FontPicker({
  direction,
  value,
  onChange,
  ...props
}: FontPickerProps) {
  const setFont = (event: Event) =>
    void onChange((event.target as SwatchSelect).value as FontId);

  return (
    <swatch-select
      {...props}
      className={styles.font}
      aria-orientation={direction === "up" ? "vertical" : "horizontal"}
      direction={direction}
      value={value}
      onchange={setFont}
    >
      <FontIcon aria-hidden="true" slot="icon" />
      {FONTS.map((font) => (
        <swatch-item style={{ fontFamily: font.family }} value={font.id}>
          {font.name}
        </swatch-item>
      ))}
    </swatch-select>
  );
}

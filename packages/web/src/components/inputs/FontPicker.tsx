import MenuItem from "@/components/buttons/MenuItem";
import { FONTS, type FontId } from "@/config/fonts";
import FontIcon from "@/icons/font.svg?jsx";
import styles from "./FontPicker.module.css";
import type { Reactive } from "@/utils/reactivity";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { JSX } from "@/jsx/jsx";

interface FontPickerProps
  extends Omit<JSX.Attributes<"div">, "value" | "onChange"> {
  value?: Reactive<FontId>;
  onChange: (value: FontId) => void;
}

export default function FontPicker({
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
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      value={value}
      on:change={setFont}
    >
      <FontIcon aria-hidden="true" slot="default-icon" />
      {FONTS.map((font) => (
        <MenuItem
          classList={{ menuitem: true }}
          style={{ fontFamily: font.family }}
          value={font.id}
        >
          {font.name}
        </MenuItem>
      ))}
    </swatch-select>
  );
}

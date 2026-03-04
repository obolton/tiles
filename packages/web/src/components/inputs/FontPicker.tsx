import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import { FONTS, type FontId } from "@/config/fonts";
import FontIcon from "@/icons/font.svg?jsx";
import styles from "./FontPicker.module.css";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "@/jsx/jsx";

export interface FontPickerProps extends JSX.Attributes<"list-select"> {
  value?: Reactive<FontId | null>;
  onChange: (value: FontId) => void;
}

export default function FontPicker({
  value,
  onChange,
  ...props
}: FontPickerProps) {
  const setFont = (event: Event) =>
    void onChange((event.target as ListSelect).value as FontId);

  return (
    <list-select
      {...props}
      className={styles.font}
      label="Font"
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      value={value}
      on:change={setFont}
    >
      <FontIcon aria-hidden="true" slot="default-icon" />
      <ListGroup>
        {FONTS.map((font) => (
          <ListOption style={{ fontFamily: font.family }} value={font.id}>
            {font.name}
          </ListOption>
        ))}
      </ListGroup>
    </list-select>
  );
}

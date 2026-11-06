import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import { FONTS, FONT_IDS, getFontConfig, type FontId } from "fonts/config";
import FontIcon from "@/icons/font.svg?jsx";
import { loadFontPreviews } from "@/utils/fonts";
import { handleError } from "@/utils/errors";
import styles from "./FontPicker.module.css";
import type { Reactive } from "reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "jsx/jsx";

export interface FontPickerProps extends JSX.Attributes<"list-select"> {
  label?: string;
  /** The trigger icon. Pass null to show none. */
  icon?: JSX.Node;
  value?: Reactive<FontId | null>;
  onChange: (value: FontId) => void;
}

export default function FontPicker({
  label = "Font",
  icon = <FontIcon aria-hidden="true" slot="default-icon" />,
  value,
  onChange,
  ...props
}: FontPickerProps) {
  if (!import.meta.env.SSR) {
    loadFontPreviews(...FONT_IDS).catch(handleError);
  }

  const setFont = (event: Event) => onChange((event.target as ListSelect).value as FontId);

  // Previews the selected font on the trigger
  const style = value?.derive((font) => ({
    "--preview-font": font ? `"${getFontConfig(font).family}"` : undefined,
  }));

  return (
    <list-select
      {...props}
      className={styles.font}
      style={style}
      label={label}
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      value={value}
      on:change={setFont}
    >
      {icon}
      <ListGroup>
        {FONTS.map((font) => (
          <ListOption
            style={{
              fontFamily: `"${font.previewFamily}", "${font.family}"`,
            }}
            value={font.id}
          >
            {font.family}
          </ListOption>
        ))}
      </ListGroup>
    </list-select>
  );
}

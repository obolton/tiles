import { themesCache } from "@/utils/cache";
import { handleError } from "@/utils/errors";
import { toCSSColor } from "@/utils/color";
import { getWorkspaceThemes } from "@/utils/workspaceThemes";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import Each from "@/jsx/each";
import PaletteIcon from "@/icons/palette.svg?jsx";
import styles from "./ThemePicker.module.css";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "@/jsx/jsx";

export interface ThemePickerProps extends Omit<
  JSX.Attributes<"list-select">,
  "value" | "on:change"
> {
  value?: Reactive<string | null>;
  onChange: (themeId: string | null) => void;
}

export default function ThemePicker({
  value,
  onChange,
  ...props
}: ThemePickerProps) {
  getWorkspaceThemes().catch(handleError);

  function setTheme(event: Event) {
    const selectedValue = (event.target as ListSelect).value;
    onChange(selectedValue === "" ? null : selectedValue);
  }

  return (
    <list-select
      {...props}
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      label="Theme"
      value={value?.derive((v) => v ?? "")}
      on:change={setTheme}
    >
      <PaletteIcon aria-hidden="true" slot="default-icon" />

      <ListGroup>
        <ListOption value="" label="None">
          None
        </ListOption>
      </ListGroup>

      <ListGroup>
        <Each items={themesCache.items}>
          {(theme) => (
            <ListOption value={theme.id}>
              <span className={styles.swatches}>
                <span
                  className={styles.swatch}
                  style={{
                    backgroundColor: toCSSColor(theme.colors.background),
                  }}
                />
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: toCSSColor(theme.colors.text) }}
                />
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: toCSSColor(theme.colors.accent) }}
                />
              </span>
              {theme.name}
            </ListOption>
          )}
        </Each>
      </ListGroup>
    </list-select>
  );
}

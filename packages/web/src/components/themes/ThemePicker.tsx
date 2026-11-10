import { combine } from "carillon";
import { themesCache } from "@/utils/cache";
import { handleError } from "@/utils/errors";
import { getWorkspaceThemes, createWorkspaceTheme } from "@/utils/workspaceThemes";
import { loadThemeFonts } from "@/utils/themes";
import ThemePreview from "@/components/themes/ThemePreview";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import PaletteIcon from "@/icons/palette.svg?jsx";
import SettingsIcon from "@/icons/settings.svg?jsx";
import NewIcon from "@/icons/new.svg?jsx";
import Editor from "@/editor/Editor";
import Theme from "@/models/Theme";
import styles from "./ThemePicker.module.css";
import type { ThemeData } from "@/models/Theme";
import type { Reactive } from "carillon";
import type ListSelect from "@/elements/list-select/ListSelect";
import type { JSX } from "jsx/jsx";

export interface ThemePickerProps extends Omit<
  JSX.Attributes<"list-select">,
  "value" | "on:change"
> {
  id: string;
  value: Reactive<ThemeData | null>;
  onChange: (theme: Theme | null) => void;
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export default function ThemePicker({ id, value, onChange, ...props }: ThemePickerProps) {
  getWorkspaceThemes().catch(handleError);

  let listSelect: ListSelect;

  // The workspace's themes by name, plus the applied snapshot if its theme has been deleted
  const options = combine({ themes: themesCache.items, value }, ({ themes, value }) => {
    const sorted = [...themes].sort((a, b) =>
      collator.compare(a.data.value.name, b.data.value.name),
    );
    if (value && !themes.some((theme) => theme.id === value.id)) {
      sorted.push(new Theme(value));
    }
    return sorted;
  });

  // The applied theme, when it still exists in the workspace
  const applied = combine({ themes: themesCache.items, value }, ({ themes, value }) =>
    value ? (themes.find((theme) => theme.id === value.id) ?? null) : null,
  );

  async function applyTheme(theme: Theme | null) {
    if (theme) {
      await loadThemeFonts(theme.data.value);
    }
    onChange(theme);
  }

  function setTheme(event: Event) {
    const selected = (event.target as ListSelect).value;
    const theme = selected ? (options.value.find((t) => t.id === selected) ?? null) : null;
    applyTheme(theme).catch(handleError);
  }

  function editTheme() {
    const theme = applied.value;
    if (!theme) {
      return;
    }
    listSelect.hide();
    Editor.current.themeEditor.edit(theme);
  }

  async function newTheme() {
    listSelect.hide();
    try {
      const theme = await createWorkspaceTheme(value.value);
      await applyTheme(theme);
      Editor.current.themeEditor.edit(theme);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <list-select
      {...props}
      id={id}
      ref={(el: ListSelect) => {
        listSelect = el;
      }}
      aria-orientation="vertical"
      orientation="vertical"
      align="center"
      showvalue
      label="Theme"
      value={value.derive((theme) => theme?.id ?? "")}
      on:change={setTheme}
    >
      <PaletteIcon aria-hidden="true" slot="default-icon" />

      <ListGroup>
        <ListOption value="" label="Default">
          Default
        </ListOption>
      </ListGroup>

      <ListGroup>
        {options.derive((themes) =>
          themes.map((theme) => (
            <ListOption value={theme.id} label={theme.data.derive((data) => data.name)}>
              <ThemePreview theme={theme.data} />
            </ListOption>
          )),
        )}
      </ListGroup>

      <div slot="footer" className={styles.footer}>
        <ToolbarButton
          classList={{ small: true }}
          label="Edit theme"
          disabled={applied.derive((theme) => !theme)}
          on:click={editTheme}
        >
          <SettingsIcon aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          classList={{ small: true }}
          label="New theme"
          on:click={() => void newTheme()}
        >
          <NewIcon aria-hidden="true" />
        </ToolbarButton>
      </div>
    </list-select>
  );
}

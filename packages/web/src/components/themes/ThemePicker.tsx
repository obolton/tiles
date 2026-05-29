import { reactive } from "@/utils/reactivity";
import { themesCache } from "@/utils/cache";
import { handleError } from "@/utils/errors";
import {
  getWorkspaceThemes,
  duplicateWorkspaceTheme,
  deleteWorkspaceTheme,
} from "@/utils/workspaceThemes";
import ThemeEditor from "@/components/themes/ThemeEditor";
import ThemePreview from "@/components/themes/ThemePreview";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import Each from "@/jsx/each";
import PaletteIcon from "@/icons/palette.svg?jsx";
import type Theme from "@/models/Theme";
import type { ThemeData } from "@/models/Theme";
import type { Reactive } from "@/utils/reactivity";
import type ListSelect from "@/elements/list-select/ListSelect";
import type AnchoredPopover from "@/elements/anchored-popover/AnchoredPopover";
import type { JSX } from "@/jsx/jsx";

export interface ThemePickerProps extends Omit<
  JSX.Attributes<"list-select">,
  "value" | "on:change"
> {
  id: string;
  value?: Reactive<ThemeData | null>;
  onChange: (theme: Theme | null) => void;
}

export default function ThemePicker({
  id,
  value,
  onChange,
  ...props
}: ThemePickerProps) {
  getWorkspaceThemes().catch(handleError);

  let listSelect: ListSelect;
  let editorPopover: AnchoredPopover;

  const selectId = `${id}-select`;
  const editorId = `${id}-editor`;
  const editing = reactive<Theme | null>(null);

  function setTheme(event: Event) {
    const selectedValue = (event.target as ListSelect).value;
    onChange(selectedValue ? themesCache.getById(selectedValue) : null);
  }

  function editTheme(theme: Theme, event: Event) {
    event.stopPropagation();
    editing.value = theme;
    listSelect.hide();
    editorPopover.showPopover();
  }

  function closeEditor() {
    if (!editing.value) {
      return;
    }
    themesCache.upsert(editing.value).catch(handleError);
    editorPopover.hidePopover();
    editing.value = null;
    listSelect.show();
  }

  async function duplicateTheme() {
    const current = editing.value;
    if (!current) {
      return;
    }
    try {
      const theme = await duplicateWorkspaceTheme(current);
      onChange(theme);
      editing.value = theme;
    } catch (error) {
      handleError(error);
    }
  }

  async function deleteTheme() {
    const theme = editing.value;
    if (!theme) {
      return;
    }
    try {
      await deleteWorkspaceTheme(theme);
      if (value?.value?.id === theme.id) {
        onChange(null);
      }
      editorPopover.hidePopover();
      editing.value = null;
      listSelect.show();
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <>
      <list-select
        {...props}
        id={selectId}
        ref={(el: ListSelect) => {
          listSelect = el;
        }}
        aria-orientation="vertical"
        orientation="vertical"
        align="center"
        showvalue
        label="Theme"
        value={value?.derive((t) => t?.id ?? "")}
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
              <ListOption value={theme.id} label={theme.name.value}>
                <ThemePreview
                  name={theme.name}
                  background={theme.background}
                  colors={theme.colors}
                  fonts={theme.fonts}
                  border={theme.border}
                  showEdit
                  onEdit={(e) => editTheme(theme, e)}
                />
              </ListOption>
            )}
          </Each>
        </ListGroup>
      </list-select>

      <anchored-popover
        id={editorId}
        ref={(el: AnchoredPopover) => {
          editorPopover = el;
        }}
        anchor={selectId}
        align="center"
      >
        {editing.derive((theme) =>
          theme ? (
            <ThemeEditor
              id={editorId}
              theme={theme}
              onBack={closeEditor}
              onDuplicate={duplicateTheme}
              onDelete={deleteTheme}
            />
          ) : null,
        )}
      </anchored-popover>
    </>
  );
}

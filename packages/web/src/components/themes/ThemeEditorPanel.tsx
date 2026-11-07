import Sidebar from "@/components/pages/Sidebar";
import ThemePreview from "@/components/themes/ThemePreview";
import FillPicker from "@/components/fills/FillPicker";
import ColorPicker from "@/components/colors/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import { THEME_EDITOR_PANEL_ID } from "./ThemeEditor";
import debounce from "@/utils/debounce";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import DuplicateIcon from "@/icons/duplicate.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import styles from "./ThemeEditorPanel.module.css";
import sidebarStyles from "@/components/pages/Sidebar.module.css";
import type ThemeEditor from "./ThemeEditor";
import type Theme from "@/models/Theme";
import type { JSX } from "jsx/jsx";

export interface ThemeEditorPanelProps extends JSX.Attributes<"resizable-panel"> {
  state: ThemeEditor;
}

export default function ThemeEditorPanel({ state, ...props }: ThemeEditorPanelProps) {
  return (
    <Sidebar state={state} label="Theme" {...props}>
      {state.theme.derive((theme) => (theme ? <ThemeForm state={state} theme={theme} /> : null))}
    </Sidebar>
  );
}

interface ThemeFormProps {
  state: ThemeEditor;
  theme: Theme;
}

function ThemeForm({ state, theme }: ThemeFormProps) {
  const { data } = theme;
  const id = THEME_EDITOR_PANEL_ID;
  const saveName = debounce((name: string) => state.update({ name }), 300);

  return (
    <form className={styles.form} on:submit={(event: Event) => event.preventDefault()}>
      <label className={styles.field}>
        <span className={sidebarStyles.heading}>Name</span>
        <input
          type="text"
          value={data.value.name}
          autofocus
          on:input={(event: Event) => saveName((event.target as HTMLInputElement).value)}
        />
      </label>

      <ThemePreview theme={data} />

      <fieldset className={styles.section}>
        <legend className={sidebarStyles.heading}>Colors</legend>
        <FillPicker
          id={`${id}-background`}
          label="Background"
          value={data.derive((d) => d.background)}
          onChange={(fill) => {
            if (fill && fill.type !== "image") {
              state.update({ background: fill });
            }
          }}
          allowImage={false}
        />
        <ColorPicker
          id={`${id}-text`}
          icon={<SolidColorIcon aria-hidden="true" />}
          label="Text"
          value={data.derive((d) => d.colors.text)}
          onChange={(color) => state.update({ colors: { text: color } })}
        />
        <ColorPicker
          id={`${id}-accent`}
          icon={<SolidColorIcon aria-hidden="true" />}
          label="Accent"
          value={data.derive((d) => d.colors.accent)}
          onChange={(color) => state.update({ colors: { accent: color } })}
        />
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={sidebarStyles.heading}>Fonts</legend>
        <FontPicker
          label="Heading"
          icon={null}
          value={data.derive((d) => d.fonts.heading)}
          onChange={(font) => state.update({ fonts: { heading: font } })}
        />
        <FontPicker
          label="Body"
          icon={null}
          value={data.derive((d) => d.fonts.body)}
          onChange={(font) => state.update({ fonts: { body: font } })}
        />
        <FontPicker
          label="Code"
          icon={null}
          value={data.derive((d) => d.fonts.code)}
          onChange={(font) => state.update({ fonts: { code: font } })}
        />
      </fieldset>

      <div className={styles.actions}>
        <button
          type="button"
          classList={{ secondary: true, small: true }}
          on:click={() => void state.duplicate()}
        >
          <DuplicateIcon aria-hidden="true" />
          Duplicate
        </button>
        <button
          type="button"
          classList={{ secondary: true, destructive: true, small: true }}
          on:click={() => state.delete()}
        >
          <TrashIcon aria-hidden="true" />
          Delete
        </button>
      </div>
    </form>
  );
}

import ToolbarButton from "@/components/buttons/ToolbarButton";
import ThemePreview from "@/components/themes/ThemePreview";
import FillPicker from "@/components/fills/FillPicker";
import ColorPicker from "@/components/colors/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import { SIDEBAR_CONSTRAINTS } from "@/components/pages/EditorLayout";
import { THEME_EDITOR_PANEL_ID } from "./ThemeEditor";
import debounce from "@/utils/debounce";
import CloseIcon from "@/icons/close.svg?jsx";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import DuplicateIcon from "@/icons/duplicate.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import styles from "./ThemeEditorPanel.module.css";
import type ThemeEditor from "./ThemeEditor";
import type Theme from "@/models/Theme";
import type { JSX } from "jsx/jsx";

export interface ThemeEditorPanelProps extends JSX.Attributes<"resizable-panel"> {
  state: ThemeEditor;
}

export default function ThemeEditorPanel({ state, classList, ...props }: ThemeEditorPanelProps) {
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      state.close();
    }
  }

  return (
    <resizable-panel
      id={THEME_EDITOR_PANEL_ID}
      classList={{ "sidebar-panel": true, ...classList }}
      role="complementary"
      aria-label="Theme"
      edge="inline-end"
      min={SIDEBAR_CONSTRAINTS.min}
      max={SIDEBAR_CONSTRAINTS.max}
      on:keydown={onKeyDown}
      {...props}
    >
      <div className="sidebar-panel-header">
        <h2 className="sidebar-panel-title">Theme</h2>
        <ToolbarButton classList={{ small: true }} label="Close" on:click={() => state.close()}>
          <CloseIcon aria-hidden="true" />
        </ToolbarButton>
      </div>

      {state.theme.derive((theme) => (theme ? <ThemeForm state={state} theme={theme} /> : null))}
    </resizable-panel>
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
        <span className={styles.label}>Name</span>
        <input
          type="text"
          value={data.value.name}
          autofocus
          on:input={(event: Event) => saveName((event.target as HTMLInputElement).value)}
        />
      </label>

      <ThemePreview theme={data} />

      <fieldset className={styles.section}>
        <legend className={styles.label}>Colors</legend>
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
        <legend className={styles.label}>Fonts</legend>
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

import ThemePreview from "@/components/themes/ThemePreview";
import FillPicker from "@/components/fills/FillPicker";
import ColorPicker from "@/components/colors/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import ToolbarButton from "@/components/buttons/ToolbarButton";
import ArrowLeftIcon from "@/icons/arrow-left.svg?jsx";
import DuplicateIcon from "@/icons/duplicate.svg?jsx";
import TrashIcon from "@/icons/trash.svg?jsx";
import styles from "./ThemeEditor.module.css";
import type Theme from "@/models/Theme";
import type { Fill } from "@/components/fills/types";

export interface ThemeEditorProps {
  id: string;
  theme: Theme;
  onBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function ThemeEditor({
  id,
  theme,
  onBack,
  onDuplicate,
  onDelete,
}: ThemeEditorProps) {
  return (
    <form
      className={styles.editor}
      on:submit={(e: Event) => e.preventDefault()}
    >
      <div className={styles.header}>
        <ToolbarButton label="Back" on:click={onBack}>
          <ArrowLeftIcon aria-hidden="true" />
        </ToolbarButton>
        <input
          type="text"
          value={theme.name}
          aria-label="Theme name"
          on:input={(e: Event) =>
            theme.setName((e.target as HTMLInputElement).value)
          }
        />
        <ToolbarButton label="Duplicate" on:click={onDuplicate}>
          <DuplicateIcon aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton label="Delete" destructive on:click={onDelete}>
          <TrashIcon aria-hidden="true" />
        </ToolbarButton>
      </div>

      <ThemePreview
        name={theme.name}
        background={theme.background}
        colors={theme.colors}
        fonts={theme.fonts}
        border={theme.border}
      />

      <div role="group" aria-label="Background" className={styles.section}>
        <h3 className={styles.legend}>Background</h3>
        <FillPicker
          id={`${id}-bg`}
          value={theme.background.derive((bg): Fill | null => bg)}
          onChange={(fill) => {
            if (!fill || fill.type === "image") {
              return;
            }
            theme.setBackground(fill);
          }}
        />
      </div>

      <div role="group" aria-label="Colors" className={styles.section}>
        <h3 className={styles.legend}>Colors</h3>
        <div className={styles.row}>
          <label>Text</label>
          <ColorPicker
            id={`${id}-text`}
            label="Text"
            value={theme.colors.derive((c) => c.text)}
            onChange={(color) => theme.setColors({ text: color })}
          />
        </div>
        <div className={styles.row}>
          <label>Accent</label>
          <ColorPicker
            id={`${id}-accent`}
            label="Accent"
            value={theme.colors.derive((c) => c.accent)}
            onChange={(color) => theme.setColors({ accent: color })}
          />
        </div>
        <div className={styles.row}>
          <label>Border</label>
          <ColorPicker
            id={`${id}-border-color`}
            label="Border"
            value={theme.border}
            onChange={(color) => theme.setBorder(color)}
            showClear
            onClear={() => theme.setBorder(null)}
          />
        </div>
      </div>

      <div role="group" aria-label="Typography" className={styles.section}>
        <h3 className={styles.legend}>Typography</h3>
        <div className={styles.row}>
          <label>Heading</label>
          <FontPicker
            aria-label="Heading"
            value={theme.fonts.derive((f) => f.heading)}
            onChange={(font) => theme.setFonts({ heading: font })}
          />
        </div>
        <div className={styles.row}>
          <label>Body</label>
          <FontPicker
            aria-label="Body"
            value={theme.fonts.derive((f) => f.body)}
            onChange={(font) => theme.setFonts({ body: font })}
          />
        </div>
        <div className={styles.row}>
          <label>Code</label>
          <FontPicker
            aria-label="Code"
            value={theme.fonts.derive((f) => f.code)}
            onChange={(font) => theme.setFonts({ code: font })}
          />
        </div>
      </div>
    </form>
  );
}

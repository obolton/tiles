import { serialize } from "@/utils/richText/serialize";
import RichText from "@/components/text/RichText";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import type { Theme } from "@/types/pages";
import type { RichText as RichTextType } from "@/utils/richText/types";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import ColorPicker from "@/components/inputs/ColorPicker";
import ExpandIcon from "@/icons/expand.svg?jsx";
import { classNames } from "@/utils/css";
import { Store } from "@/utils/stores";
import type { StoreInterface } from "@/utils/stores";
import type Editor from "@/editor/Editor";

interface TextTileProps {
  editor: Editor;
  id: string;
  content: RichTextType;
  theme: Theme | null;
  hue: number | null;
  expand: boolean;
  hasFocus: StoreInterface<boolean>;
  onDelete?: () => void;
}

export default function TextTile({
  editor,
  id,
  content,
  theme: initialTheme,
  hue: initialHue,
  expand: initialExpand,
  hasFocus,
  onDelete,
}: TextTileProps) {
  const { isEditable } = editor;
  const theme = new Store(initialTheme);
  const hue = new Store(initialHue);
  const expand = new Store(initialExpand);

  const onBlur = async (state: EditorState) => {
    const content = serialize(state);
    await editor.updateText({
      id,
      content,
    });
  };

  const onChangeColor = async (value: ColorPickerValue) => {
    const newTheme = value?.theme ?? null;
    const newHue = value?.hue ?? null;
    theme.value = newTheme;
    hue.value = newHue;
    await editor.updateText({
      id,
      theme: newTheme,
      hue: newHue,
    });
  };

  const onToggleExpand = async () => {
    expand.value = !expand.value;
    await editor.updateText({
      id,
      expand: !expand,
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const editor = event.currentTarget as HTMLElement;
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      !event.repeat &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      editor.textContent === ""
    ) {
      onDelete?.();
    }
  };

  return (
    <Tile
      theme={theme}
      hue={hue}
      border={theme.derive((value) => (value ? "outside" : "none"))}
    >
      <pop-out
        className={styles["pop-out"]}
        expandable={!expand ? "expandable" : undefined}
      >
        {isEditable.derive((value) =>
          value ? (
            <TextEditor
              classList={[styles.text, styles.editor]}
              initialValue={content}
              tabIndex={-1}
              onkeydown={onDelete ? onKeyDown : undefined}
              onBlur={onBlur}
              showToolbar={hasFocus}
              extraToolbarItems={
                <ul role="group">
                  <li role="presentation">
                    <ColorPicker
                      role="menuitem"
                      value={{ theme: theme.value, hue: hue.value }}
                      onChange={onChangeColor}
                      aria-label="Color"
                      data-tooltip="Select color"
                      direction="up"
                      showClear
                    />
                  </li>
                  <li role="presentation">
                    <button
                      role="menuitem"
                      className="floating small"
                      aria-label="Fit contents"
                      data-tooltip="Fit contents"
                      type="button"
                      aria-pressed={expand ? "true" : "false"}
                      onclick={onToggleExpand}
                    >
                      <ExpandIcon aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              }
            />
          ) : (
            <RichText className={styles.text} content={content} />
          ),
        )}
      </pop-out>
    </Tile>
  );
}

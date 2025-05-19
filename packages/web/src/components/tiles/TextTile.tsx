import { serialize } from "@/utils/richText/serialize";
import RichText from "@/components/text/RichText";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import ColorPicker from "@/components/inputs/ColorPicker";
import ExpandIcon from "@/icons/expand.svg?jsx";
import { Computed } from "@/utils/reactivity";
import { viewTransition } from "@/utils/transitions";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type { Color } from "@/utils/color";
import type { TextProperties } from "@/types/tiles";

export interface TextTileProps extends TextProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
  onDelete?: () => void;
}

export default function TextTile({
  editor,
  id,
  content,
  lightness,
  chroma,
  hue,
  expand,
  hasFocus,
  onDelete,
}: TextTileProps) {
  const { isEditable } = editor;

  const color = new Computed([lightness, chroma, hue], () =>
    typeof lightness.value === "number" &&
    typeof chroma.value === "number" &&
    typeof hue.value == "number"
      ? {
          l: lightness.value,
          c: chroma.value,
          h: hue.value,
        }
      : null,
  );

  const onBlur = async (state: EditorState) => {
    const newContent = serialize(state);
    content.value = newContent;

    await editor.updateText({
      id,
      content: newContent,
    });
  };

  const onChangeColor = async (value: Color | null) => {
    viewTransition(() => {
      lightness.value = value ? value.l : null;
      chroma.value = value ? value.c : null;
      hue.value = value ? value.h : null;
    });
    await editor.updateText({
      id,
      color: value,
    });
  };

  const onToggleExpand = async () => {
    expand.value = !expand.value;
    await editor.updateText({
      id,
      expand: expand.value,
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
      color={color}
      border={color.derive((value) => (value ? "outside" : "none"))}
    >
      <pop-out
        className={styles["pop-out"]}
        expandable={expand.derive((value) =>
          value ? undefined : "expandable",
        )}
      >
        {isEditable.derive((value) =>
          value ? (
            <TextEditor
              classList={[styles.text, styles.editor]}
              initialValue={content.value}
              tabIndex={-1}
              onkeydown={onDelete ? onKeyDown : undefined}
              onBlur={onBlur}
              showToolbar={hasFocus}
              extraToolbarItems={
                <ul role="group">
                  <li role="presentation">
                    <ColorPicker
                      role="menuitem"
                      value={color}
                      onChange={onChangeColor}
                      aria-label="Color"
                      data-tooltip="Select color"
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
                      aria-pressed={expand.derive((value) =>
                        value ? "true" : "false",
                      )}
                      onclick={onToggleExpand}
                    >
                      <ExpandIcon aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              }
            />
          ) : (
            <div classList={["rich-text", styles.text]}>
              {content.derive((value) => (
                <RichText content={value} />
              ))}
            </div>
          ),
        )}
      </pop-out>
    </Tile>
  );
}

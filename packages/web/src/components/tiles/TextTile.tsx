import { useCallback, useState } from "react";
import { serialize } from "@/utils/richText/serialize";
import RichText from "@/components/text/RichText";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";
import type { RichText as RichTextType } from "@/utils/richText/types";
import { useEditor } from "@/context/editor";
import type { EditorState } from "prosemirror-state";
import TextEditor from "@/components/inputs/RichTextEditor/TextEditor";
import ColorPicker from "@/components/inputs/ColorPicker";
import ExpandIcon from "@/icons/expand.svg?jsx";

interface TextTileProps {
  id: string;
  content: RichTextType;
  theme: Theme | null;
  hue: number | null;
  expand: boolean;
  hasFocus: boolean;
  onDelete?: () => void;
}

export default function TextTile({
  id,
  content,
  theme: initialTheme,
  hue: initialHue,
  expand: initialExpand,
  hasFocus,
  onDelete,
}: TextTileProps) {
  const editor = useEditor();
  const isEditable = useEditable();
  const [theme, setTheme] = useState(initialTheme);
  const [hue, setHue] = useState(initialHue);
  const [expand, setExpand] = useState(initialExpand);

  const onBlur = useCallback(
    async (state: EditorState) => {
      const content = serialize(state);
      await editor.updateText({
        id,
        content,
      });
    },
    [editor, id],
  );

  const onChangeColor = useCallback(
    async (value: ColorPickerValue) => {
      const theme = value?.theme ?? null;
      const hue = value?.hue ?? null;
      setTheme(theme);
      setHue(hue);
      await editor.updateText({
        id,
        theme,
        hue,
      });
    },
    [editor, id],
  );

  const onToggleExpand = useCallback(async () => {
    setExpand(!expand);
    await editor.updateText({
      id,
      expand: !expand,
    });
  }, [editor, id, expand]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        !event.repeat &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.currentTarget.textContent === ""
      ) {
        onDelete?.();
      }
    },
    [onDelete],
  );

  return (
    <Tile theme={theme} hue={hue} border={theme ? "outside" : "none"}>
      <pop-out
        class={styles["pop-out"]}
        expandable={!expand ? "expandable" : undefined}
      >
        {isEditable ? (
          <TextEditor
            className={classNames(styles.text, styles.editor)}
            initialValue={content}
            onKeyDownCapture={onDelete ? onKeyDown : undefined}
            onBlur={onBlur}
            showToolbar={hasFocus}
            extraToolbarItems={
              <ul role="group">
                <li role="presentation">
                  <ColorPicker
                    role="menuitem"
                    value={{ theme, hue }}
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
                    onClick={onToggleExpand}
                  >
                    <ExpandIcon aria-hidden="true" />
                  </button>
                </li>
              </ul>
            }
          />
        ) : (
          <div className={styles.text}>
            <RichText content={content} />
          </div>
        )}
      </pop-out>
    </Tile>
  );
}

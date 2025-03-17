import { useCallback, useRef, useState } from "react";
import { serialize } from "@/utils/richText/serialize";
import RichTextEditor from "@/components/inputs/RichTextEditor/RichTextEditor";
import RichText from "@/components/text/RichText";
import FormattingToolbar from "@/components/inputs/RichTextEditor/FormattingToolbar";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import Tile from "./Tile";
import ExpandIcon from "@/icons/expand.svg?jsx";
import styles from "./TextTile.module.css";
import { classNames } from "@/utils/css";
import type { EditorState } from "@/components/inputs/RichTextEditor/RichTextEditor";
import type { Theme } from "@/types/pages";
import type { RichText as RichTextType } from "@/utils/richText/types";
import { useEditor } from "@/context/editor";

interface TextTileProps {
  id: string;
  columns: number;
  content: RichTextType;
  theme: Theme | null;
  hue: number | null;
  expand: boolean;
  hasFocus: boolean;
}

export default function TextTile({
  id,
  columns,
  content,
  theme: initialTheme,
  hue: initialHue,
  expand: initialExpand,
  hasFocus,
}: TextTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const editor = useEditor();
  const isEditable = useEditable();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [theme, setTheme] = useState(initialTheme);
  const [hue, setHue] = useState(initialHue);
  const [expand, setExpand] = useState(initialExpand);

  const onBlur = useCallback(async () => {
    if (!editorState) {
      return;
    }
    const content = serialize(editorState);
    await editor.updateText({
      id,
      content,
    });
  }, [editor, editorState, id]);

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

  const expandable = columns !== 3;
  const onToggleExpand = useCallback(async () => {
    setExpand(!expand);
    await editor.updateText({
      id,
      expand: !expand,
    });
  }, [editor, id, expand]);

  return (
    <pop-out
      class={styles["pop-out"]}
      tabindex="0"
      expandable={expandable ? "expandable" : undefined}
    >
      <Tile
        theme={theme}
        hue={hue}
        border={isEditable || !!theme || columns === 1 ? "outside" : "none"}
      >
        {isEditable ? (
          <RichTextEditor
            ref={ref}
            className={classNames(styles.text, styles.editor)}
            onBlur={onBlur}
            onChange={setEditorState}
            placeholder="Write something"
            value={content}
            editable
            tabIndex={-1}
          >
            {hasFocus ? (
              <FormattingToolbar
                className={styles.toolbar}
                color={{ theme, hue }}
                onChangeColor={onChangeColor}
                expand={expand}
                onToggleExpand={onToggleExpand}
              />
            ) : null}
          </RichTextEditor>
        ) : (
          <div className={classNames(styles.text, styles.static)}>
            <RichText content={content} />
          </div>
        )}
        {expandable ? (
          <ExpandIcon
            className={classNames(styles.icon, theme === "DARK" && styles.dark)}
            aria-hidden="true"
          />
        ) : null}
      </Tile>
    </pop-out>
  );
}

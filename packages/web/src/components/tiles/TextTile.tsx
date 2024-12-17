import { useCallback, useState } from "react";
import { serialize } from "@/utils/richText/serialize";
import RichTextEditor from "@/components/inputs/RichTextEditor/RichTextEditor";
import RichText from "@/components/text/RichText";
import FormattingToolbar from "@/components/inputs/RichTextEditor/FormattingToolbar";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import { updateText } from "@/utils/edit";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import { classNames } from "@/utils/css";
import type { EditorState } from "@/components/inputs/RichTextEditor/RichTextEditor";
import type { Theme } from "@/types/pages";
import type { RichText as RichTextType } from "@/utils/richText/types";

interface TextTileProps {
  id: string;
  columns: number;
  content: RichTextType;
  theme: Theme | null;
  hue: number | null;
}

export default function TextTile({
  id,
  columns,
  content,
  theme: initialTheme,
  hue: initialHue,
}: TextTileProps) {
  const isEditable = useEditable();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [theme, setTheme] = useState(initialTheme);
  const [hue, setHue] = useState(initialHue);

  const onBlur = useCallback(async () => {
    if (!editorState) {
      return;
    }
    const content = serialize(editorState);
    await updateText({
      id,
      content,
    });
  }, [editorState, id]);

  const onChangeColor = useCallback(
    async (value: ColorPickerValue) => {
      const theme = value?.theme ?? null;
      const hue = value?.hue ?? null;
      setTheme(theme);
      setHue(hue);
      await updateText({
        id,
        theme,
        hue,
      });
    },
    [id],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent | React.MouseEvent) => {
      event.stopPropagation();
    },
    [],
  );

  return (
    <pop-out
      class={styles["pop-out"]}
      tabindex="0"
      expandable={columns === 3 ? undefined : "expandable"}
    >
      <Tile theme={theme} hue={hue} showBorder={isEditable || !!theme}>
        {isEditable ? (
          <RichTextEditor
            className={classNames(styles.text, styles.editor)}
            onBlur={onBlur}
            onChange={setEditorState}
            onPointerDownCapture={onPointerDown}
            onClickCapture={onPointerDown}
            placeholder="Write something"
            value={content}
            editable
          >
            <FormattingToolbar
              className={styles.toolbar}
              color={{ theme, hue }}
              onChangeColor={onChangeColor}
            />
          </RichTextEditor>
        ) : (
          <div className={classNames(styles.text, styles.static)} tabIndex={0}>
            <RichText content={content} />
          </div>
        )}
      </Tile>
    </pop-out>
  );
}

import { useCallback, useState } from "react";
import { serialize } from "@/utils/richText/serialize";
import RichTextEditor from "@/components/inputs/RichTextEditor/RichTextEditor";
import RichText from "@/components/text/RichText";
import Toolbar from "@/components/inputs/RichTextEditor/Toolbar";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import { updateTile } from "@/utils/edit";
import Tile, { type TileProps } from "./Tile";
import styles from "./TextTile.module.css";
import { classNames } from "@/utils/css";
import type { ClientText } from "@/types/tiles";
import type { EditorState } from "@/components/inputs/RichTextEditor/RichTextEditor";

interface TextTileProps extends TileProps {
  columns: number;
  text: ClientText;
}

export default function TextTile({
  id,
  columns,
  text,
  ...tile
}: TextTileProps) {
  const { content, theme: initialTheme, hue: initialHue } = text;
  const isEditable = useEditable();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [theme, setTheme] = useState(initialTheme);
  const [hue, setHue] = useState(initialHue);

  const onBlur = useCallback(async () => {
    if (!editorState) {
      return;
    }
    const content = serialize(editorState);
    await updateTile(id, {
      type: "TEXT",
      text: {
        content,
      },
    });
  }, [editorState, id]);

  const onChangeColor = useCallback(
    async ({ theme, hue }: ColorPickerValue) => {
      setTheme(theme);
      if (typeof hue === "number") {
        setHue(hue);
      }
      await updateTile(id, {
        type: "TEXT",
        text: {
          theme,
          hue,
        },
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
      origin="top-left"
    >
      <Tile
        {...tile}
        id={id}
        theme={theme}
        hue={hue}
        showBorder={isEditable || columns < 3}
      >
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
            <Toolbar
              className={styles.toolbar}
              color={{ theme, hue: hue ?? undefined }}
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

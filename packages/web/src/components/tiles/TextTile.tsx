import { useCallback, useState } from "react";
import { serialize } from "@/utils/richText/serialize";
import RichTextEditor from "@/components/inputs/RichTextEditor/RichTextEditor";
import RichText from "@/components/text/RichText";
import ColorPicker from "@/components/inputs/ColorPicker";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import { updateTile } from "@/utils/edit";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import type { ClientTextTile } from "@/types/tiles";
import type { EditorState } from "@/components/inputs/RichTextEditor/RichTextEditor";

type TextTileProps = {
  tile: ClientTextTile;
};

export default function TextTile({ tile }: TextTileProps) {
  const {
    id,
    text: { content, theme: initialTheme, hue: initialHue },
  } = tile;
  const isEditable = useEditable();
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [theme, setTheme] = useState(initialTheme);
  const [hue, setHue] = useState(initialHue);

  const onBlur = useCallback(async () => {
    if (!editorState) {
      return;
    }
    const content = serialize(editorState);
    await updateTile({
      id,
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
      await updateTile({
        id,
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
    <Tile
      theme={theme}
      hue={hue}
      tile={tile}
      showBorder={tile.columns < 3}
      showInLightbox={false}
    >
      {isEditable ? (
        <>
          <RichTextEditor
            className={`${styles.text} ${styles.editor}`}
            onBlur={onBlur}
            onChange={setEditorState}
            onPointerDownCapture={onPointerDown}
            onClickCapture={onPointerDown}
            placeholder="Enter some text"
            value={content}
            editable
          />

          <ColorPicker
            className={styles["color-picker"]}
            value={{ theme, hue: hue ?? undefined }}
            onChange={onChangeColor}
          />
        </>
      ) : (
        <div className={styles.text}>
          <RichText content={content} />
        </div>
      )}
    </Tile>
  );
}

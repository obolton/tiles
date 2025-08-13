import { serialize } from "@/utils/richText/serialize";
import RichText from "@/components/text/RichText";
import TextToolbar from "@/components/toolbars/text/TextToolbar";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import ColorPicker from "@/components/colors/ColorPicker";
import ExpandIcon from "@/icons/expand.svg?jsx";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type { TextProperties } from "@/types/tiles";
import type { Color } from "@/utils/color";

export interface TextTileProps extends TextProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
  onDelete?: () => void;
}

export default function TextTile({
  editor,
  id,
  placementId,
  content,
  textColor,
  background,
  block,
  align,
  hasFocus,
  onDelete,
}: TextTileProps) {
  const { isEditable } = editor;

  const onBlur = async (state: EditorState) => {
    try {
      const newContent = serialize(state);
      content.value = newContent;
      await editor.updateText({
        id,
        content: newContent,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const onChangeTextColor = async (value: Color | null) => {
    try {
      const { textColor: newTextColor } = await editor.updateText({
        id,
        textColor: value,
      });
      viewTransition(() => (textColor.value = newTextColor));
    } catch (error) {
      handleError(error);
    }
  };

  function onKeyDown(event: KeyboardEvent) {
    const { currentTarget, target, key } = event;

    if (
      event.defaultPrevented ||
      event.repeat ||
      event.shiftKey ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    // Delete the tile if it is empty
    if (
      (key === "Delete" || key === "Backspace") &&
      target === currentTarget &&
      (currentTarget as HTMLElement).textContent === ""
    ) {
      event.stopPropagation();
      event.preventDefault();
      onDelete?.();
    }

    // Prevent ancestors from acting on keyboard navigation
    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "Home" ||
      key === "End"
    ) {
      event.stopPropagation();
    }
  }

  const alignClass = align.derive((value) => {
    switch (value) {
      default:
      case "TOP":
        return styles["align-top"];
      case "CENTER":
        return styles["align-center"];
      case "BOTTOM":
        return styles["align-bottom"];
    }
  });

  const contents = isEditable.derive((value) =>
    value ? (
      <TextEditor
        editor={editor}
        classList={[styles.text, styles.editor, alignClass]}
        initialValue={content.value}
        tabIndex={-1}
        on:keydown={onKeyDown}
        onBlur={onBlur}
        showToolbar={hasFocus}
        extraToolbarItems={
          <ul role="group">
            <li role="presentation">
              <ColorPicker value={textColor} onChange={onChangeTextColor} />
            </li>
          </ul>
        }
      />
    ) : (
      <div classList={["rich-text", styles.text, alignClass]}>
        {content.derive((value) => (
          <RichText content={value} />
        ))}
      </div>
    ),
  );

  return (
    <Tile
      textColor={textColor}
      background={background}
      border={background.derive((value) => (value ? "outside" : "none"))}
    >
      {hasFocus.derive((value) =>
        value ? (
          <TextToolbar
            editor={editor}
            id={id}
            placementId={placementId}
            background={background}
            align={align}
            block={block}
          />
        ) : null,
      )}

      {block.derive((value) =>
        value ? (
          contents
        ) : (
          <pop-out className={styles["pop-out"]}>
            {contents}
            <ExpandIcon className={styles["expand-icon"]} aria-hidden="true" />
          </pop-out>
        ),
      )}
    </Tile>
  );
}

import { serialize } from "@/utils/richText/serialize";
import RichText from "@/components/text/RichText";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import BackgroundPicker from "@/components/backgrounds/BackgroundPicker";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import ExpandIcon from "@/icons/expand.svg?jsx";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import type { Reactive } from "@/utils/reactivity";
import type Editor from "@/editor/Editor";
import type { TextProperties } from "@/types/tiles";
import type SwatchSelect from "@/elements/swatch/SwatchSelect";
import type { Background } from "@/components/backgrounds/types";

const ALIGN_ICON = {
  TOP: <VerticalAlignTopIcon aria-hidden="true" slot="icon" />,
  CENTER: <VerticalAlignCenterIcon aria-hidden="true" slot="icon" />,
  BOTTOM: <VerticalAlignBottomIcon aria-hidden="true" slot="icon" />,
} as const;

export interface TextTileProps extends TextProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
  onDelete?: () => void;
}

export default function TextTile({
  editor,
  id,
  content,
  background,
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

  const onChangeBackground = async (value: Background) => {
    try {
      const { background: newBackground } = await editor.updateText({
        id,
        background: value,
      });
      viewTransition(() => (background.value = newBackground));
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

  const onChangeVerticalAlignment = async (event: Event) => {
    try {
      const value = (event.currentTarget as SwatchSelect).value as
        | "TOP"
        | "CENTER"
        | "BOTTOM";
      align.value = value;
      await editor.updateText({
        id,
        align: value,
      });
    } catch (error) {
      handleError(error);
    }
  };

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

  return (
    <Tile
      background={background}
      border={background.derive((value) => (value ? "outside" : "none"))}
    >
      <pop-out className={styles["pop-out"]} expandable>
        {isEditable.derive((value) =>
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
                    <BackgroundPicker
                      value={background}
                      onChange={onChangeBackground}
                    />
                  </li>

                  <li role="presentation">
                    <swatch-select
                      role="menuitem"
                      aria-label="Vertical position"
                      data-tooltip="Vertical position"
                      aria-orientation="vertical"
                      orientation="vertical"
                      align="center"
                      value={align}
                      on:change={onChangeVerticalAlignment}
                    >
                      {align.derive((value) => ALIGN_ICON[value])}

                      <swatch-item
                        value="TOP"
                        data-tooltip="Top"
                        data-tooltip-position="right"
                      >
                        <VerticalAlignTopIcon aria-hidden="true" />
                      </swatch-item>
                      <swatch-item
                        value="CENTER"
                        data-tooltip="Center"
                        data-tooltip-position="right"
                      >
                        <VerticalAlignCenterIcon aria-hidden="true" />
                      </swatch-item>
                      <swatch-item
                        value="BOTTOM"
                        data-tooltip="Bottom"
                        data-tooltip-position="right"
                      >
                        <VerticalAlignBottomIcon aria-hidden="true" />
                      </swatch-item>
                    </swatch-select>
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
        )}

        <ExpandIcon className={styles["expand-icon"]} aria-hidden="true" />
      </pop-out>
    </Tile>
  );
}

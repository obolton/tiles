import { serialize } from "@/utils/richText/serialize";
import RichText from "@/components/text/RichText";
import Tile from "./Tile";
import styles from "./TextTile.module.css";
import TextEditor, {
  type EditorState,
} from "@/components/inputs/RichTextEditor/TextEditor";
import ColorPicker from "@/components/inputs/ColorPicker";
import ImageIcon from "@/icons/image.svg?jsx";
import VerticalAlignTopIcon from "@/icons/vertical-align-top.svg?jsx";
import VerticalAlignCenterIcon from "@/icons/vertical-align-center.svg?jsx";
import VerticalAlignBottomIcon from "@/icons/vertical-align-bottom.svg?jsx";
import ExpandIcon from "@/icons/expand.svg?jsx";
import { showModal } from "@/utils/modals";
import { uploadMedia } from "@/utils/media";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import type { ImageModalResult } from "@/components/modals/image/ImageModal";
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
  color,
  imageUrl,
  expand,
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

  const onChangeColor = async (value: Color | null) => {
    try {
      viewTransition(() => {
        color.value = value;
      });
      await editor.updateText({
        id,
        color: value,
      });
    } catch (error) {
      handleError(error);
    }
  };

  const onSelectImage = async () => {
    if (imageUrl.value) {
      try {
        imageUrl.value = null;
        await editor.updateText({
          id,
          imageKey: null,
        });
      } catch (error) {
        handleError(error);
      }
    } else {
      showModal<ImageModalResult>("IMAGE", {
        async onConfirm(result) {
          if (!result) {
            return;
          }
          try {
            const imageKey = await uploadMedia(result.image, "image");
            const { imageUrl: newImageUrl } = await editor.updateText({
              id,
              imageKey,
            });
            imageUrl.value = newImageUrl;
          } catch (error) {
            handleError(error);
          }
        },
      });
    }
  };

  const onToggleExpand = async () => {
    try {
      expand.value = !expand.value;
      await editor.updateText({
        id,
        expand: expand.value,
      });
    } catch (error) {
      handleError(error);
    }
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
      backgroundImageUrl={imageUrl}
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
                      value={color}
                      onChange={onChangeColor}
                      showClear
                    />
                  </li>
                  <li role="presentation">
                    <button
                      role="menuitem"
                      className="floating small"
                      aria-label="Background image"
                      data-tooltip="Background image"
                      type="button"
                      aria-pressed={imageUrl.derive((value) =>
                        value ? "true" : "false",
                      )}
                      on:click={onSelectImage}
                    >
                      <ImageIcon aria-hidden="true" />
                    </button>
                  </li>
                  <li role="presentation">
                    <swatch-select
                      role="menuitem"
                      aria-label="Vertical position"
                      data-tooltip="Vertical position"
                      aria-orientation="vertical"
                      orientation="vertical"
                      align="center"
                    >
                      <VerticalAlignTopIcon aria-hidden="true" slot="icon" />

                      <swatch-item
                        value="top"
                        data-tooltip="Top"
                        data-tooltip-position="right"
                      >
                        <VerticalAlignTopIcon aria-hidden="true" />
                      </swatch-item>
                      <swatch-item
                        value="center"
                        data-tooltip="Center"
                        data-tooltip-position="right"
                      >
                        <VerticalAlignCenterIcon aria-hidden="true" />
                      </swatch-item>
                      <swatch-item
                        value="bottom"
                        data-tooltip="Bottom"
                        data-tooltip-position="right"
                      >
                        <VerticalAlignBottomIcon aria-hidden="true" />
                      </swatch-item>
                    </swatch-select>
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
                      on:click={onToggleExpand}
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

        <ExpandIcon className={styles["expand-icon"]} aria-hidden="true" />
      </pop-out>
    </Tile>
  );
}

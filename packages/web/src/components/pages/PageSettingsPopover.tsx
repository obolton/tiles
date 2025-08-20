import ColorPicker from "@/components/colors/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import { getFontConfig } from "@/utils/fonts";
import { toCSSColor, isDark, type Color } from "@/utils/color";
import { redirectWithToast } from "@/utils/toasts";
import styles from "./PageSettingsPopover.module.css";
import type { FontId } from "@/config/fonts";
import type PopoverMenu from "@/elements/menu/PopoverMenu";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";

export interface PageSettingsPopoverProps extends JSX.Attributes<PopoverMenu> {
  editor: Editor;
  allowDelete?: boolean;
}

export default function PageSettingsPopover({
  editor,
  allowDelete,
  ...props
}: PageSettingsPopoverProps) {
  const { title, color, font } = editor;

  function onSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get("title") as string;

    editor.setPageTitle(title).catch(handleError);
  }

  function onTitleBlur(event: Event) {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    textarea.form?.requestSubmit();
  }

  function setFont(font: FontId) {
    viewTransition(() => {
      document.body.style.setProperty("--font", getFontConfig(font).family);
    });
    editor.setFont(font).catch(handleError);
  }

  function setColor(value: Color | null) {
    if (!value) {
      return;
    }
    color.value = value;
    viewTransition(() => {
      if (isDark(value)) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
      document.body.style.setProperty("--background-color", toCSSColor(value));
    });
    editor.setColor(value).catch(handleError);
  }

  function deletePage() {
    editor
      .deletePage()
      .then(() =>
        redirectWithToast(
          `/workspaces/${editor.workspaceId}/trash`,
          "The page was deleted.",
          "success",
        ),
      )
      .catch(handleError);
  }

  return (
    <popover-menu className={styles.popover} {...props}>
      <form on:submit={onSubmit}>
        <ResizingTextarea
          className={styles.title}
          name="title"
          placeholder="Page title"
          autofocus
          value={title}
          on:blur={onTitleBlur}
        />
      </form>

      <ul
        className={styles.options}
        role="group"
        aria-label="Page options"
        data-tooltip-position="bottom"
      >
        <li role="presentation">
          <FontPicker
            role="menuitem"
            value={font}
            onChange={setFont}
            aria-label="Font"
            data-tooltip="Font"
          />
        </li>

        <li role="presentation">
          <ColorPicker value={color} onChange={setColor} />
        </li>

        <li role="presentation" className={styles.trailing}>
          <button
            type="button"
            className="floating destructive"
            disabled={allowDelete ? undefined : true}
            aria-label="Delete page"
            data-tooltip="Delete page"
            on:click={deletePage}
          >
            <TrashIcon aria-hidden="true" />
          </button>
        </li>
      </ul>
    </popover-menu>
  );
}

import ColorPicker from "@/components/colors/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import FolderPicker from "@/components/inputs/FolderPicker";
import ThemePicker from "@/components/themes/ThemePicker";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import TrashIcon from "@/icons/trash.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import { getFontConfig } from "@/utils/fonts";
import { toCSSColor, isDark, type Color } from "@/utils/color";
import { redirectWithToast } from "@/utils/toasts";
import { getCachedWorkspaceThemes } from "@/utils/workspaceThemes";
import { getThemeStyles } from "@/utils/themes";
import styles from "./PageSettingsPopover.module.css";
import type { FontId } from "@/config/fonts";
import type Editor from "@/editor/Editor";
import type { JSX } from "@/jsx/jsx";

export interface PageSettingsPopoverProps extends JSX.Attributes<"popover-menu"> {
  editor: Editor;
  allowDelete?: boolean;
}

export default function PageSettingsPopover({
  editor,
  allowDelete,
  ...props
}: PageSettingsPopoverProps) {
  const { title, backgroundColor, font, folderId, themeId } = editor;

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
    backgroundColor.value = value;
    viewTransition(() => {
      if (isDark(value)) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
      document.body.style.setProperty("--background-color", toCSSColor(value));
    });
    editor.setBackgroundColor(value).catch(handleError);
  }

  function setFolder(folderId: string | null) {
    editor.setFolder(folderId).catch(handleError);
  }

  function setTheme(newThemeId: string | null) {
    const themes = getCachedWorkspaceThemes(editor.workspaceId);
    const theme = themes?.find((t) => t.id === newThemeId) ?? null;

    const bgColor = backgroundColor.value;
    const styles = getThemeStyles(theme, {
      background: bgColor ? { type: "color", color: bgColor } : null,
      font: font.value,
    });

    viewTransition(() => {
      for (const [property, value] of Object.entries(styles)) {
        document.body.style.setProperty(property, value);
      }
      const bgColor = theme?.colors.background ?? backgroundColor.value;
      document.body.classList.toggle("dark", !!bgColor && isDark(bgColor));
    });

    editor.setTheme(newThemeId).catch(handleError);
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
          <ColorPicker
            id="page-color-picker"
            value={backgroundColor}
            onChange={setColor}
          />
        </li>

        <li role="presentation">
          <FolderPicker
            role="menuitem"
            value={folderId}
            onChange={setFolder}
            aria-label="Folder"
            data-tooltip="Folder"
          />
        </li>

        <li role="presentation">
          <ThemePicker
            role="menuitem"
            workspaceId={editor.workspaceId}
            value={themeId}
            onChange={setTheme}
            aria-label="Theme"
            data-tooltip="Theme"
          />
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

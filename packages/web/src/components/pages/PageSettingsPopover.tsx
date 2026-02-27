import ColorPicker from "@/components/colors/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import FolderPicker from "@/components/inputs/FolderPicker";
import ThemePicker from "@/components/themes/ThemePicker";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import TrashIcon from "@/icons/trash.svg?jsx";
import SizeIcon from "@/icons/size.svg?jsx";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import { getFontConfig } from "@/utils/fonts";
import { toCSSColor, isDark, type Color } from "@/utils/color";
import { redirectWithToast } from "@/utils/toasts";
import { themesCache } from "@/utils/cache";
import { getThemeStyles } from "@/utils/themes";
import styles from "./PageSettingsPopover.module.css";
import type { FontId } from "@/config/fonts";
import type { HorizontalAlignment } from "api/types/pages";
import type ListSelect from "@/elements/list-select/ListSelect";
import type Page from "@/models/Page";
import type { JSX } from "@/jsx/jsx";

export interface PageSettingsPopoverProps extends JSX.Attributes<"anchored-popover"> {
  page: Page;
  allowDelete?: boolean;
}

export default function PageSettingsPopover({
  page,
  allowDelete,
  ...props
}: PageSettingsPopoverProps) {
  const { title, backgroundColor, font, folderId, themeId } = page;

  function onSubmit(event: Event) {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get("title") as string;

    page.setTitle(title).catch(handleError);
  }

  function onTitleBlur(event: Event) {
    const textarea = event.currentTarget as HTMLTextAreaElement;
    textarea.form?.requestSubmit();
  }

  function setFont(font: FontId) {
    viewTransition(() => {
      document.body.style.setProperty("--font", getFontConfig(font).family);
    });
    page.setFont(font).catch(handleError);
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
    page.setBackgroundColor(value).catch(handleError);
  }

  function setFolder(folderId: string | null) {
    page.setFolder(folderId).catch(handleError);
  }

  function setTheme(newThemeId: string | null) {
    const theme = newThemeId ? themesCache.getById(newThemeId) : null;

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

    page.setTheme(newThemeId).catch(handleError);
  }

  function setWidth(event: Event) {
    const value = (event.currentTarget as ListSelect).value;
    if (value) {
      page.setWidth(parseInt(value, 10)).catch(handleError);
    }
  }

  function setAlignment(event: Event) {
    const alignment = (event.currentTarget as ListSelect)
      .value as HorizontalAlignment;
    page.setAlignment(alignment).catch(handleError);
  }

  function deletePage() {
    page
      .delete()
      .then(() =>
        redirectWithToast(
          `/workspaces/${page.workspaceId}/trash`,
          "The page was deleted.",
          "success",
        ),
      )
      .catch(handleError);
  }

  return (
    <anchored-popover className={styles.popover} {...props}>
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
            value={themeId}
            onChange={setTheme}
            aria-label="Theme"
            data-tooltip="Theme"
          />
        </li>

        <li role="presentation">
          <list-select
            label="Page width"
            aria-label="Page width"
            data-tooltip="Page width"
            orientation="vertical"
            value={page.width}
            showvalue
            on:change={setWidth}
          >
            <SizeIcon slot="default-icon" aria-hidden="true" />
            <ListGroup>
              <ListOption value="32">Standard</ListOption>
              <ListOption value="24">Narrow</ListOption>
              <ListOption value="40">Wide</ListOption>
              <ListOption value="48">Full</ListOption>
            </ListGroup>
          </list-select>
        </li>

        <li role="presentation">
          <list-select
            label="Alignment"
            aria-label="Alignment"
            data-tooltip="Alignment"
            orientation="vertical"
            value={page.alignment}
            showvalue
            on:change={setAlignment}
          >
            <ListGroup>
              <ListOption
                icon={<AlignLeftIcon aria-hidden="true" />}
                value="LEFT"
              >
                Left
              </ListOption>
              <ListOption
                icon={<AlignCenterIcon aria-hidden="true" />}
                value="CENTER"
              >
                Center
              </ListOption>
              <ListOption
                icon={<AlignRightIcon aria-hidden="true" />}
                value="RIGHT"
              >
                Right
              </ListOption>
            </ListGroup>
          </list-select>
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
    </anchored-popover>
  );
}

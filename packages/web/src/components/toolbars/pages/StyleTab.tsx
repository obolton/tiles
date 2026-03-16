import ColorPicker from "@/components/colors/ColorPicker";
import SolidColorIcon from "@/icons/solid-color.svg?jsx";
import FontPicker from "@/components/inputs/FontPicker";
import ThemePicker from "@/components/themes/ThemePicker";
import ToolbarGroup from "@/components/toolbars/ToolbarGroup";
import ListOption from "@/components/lists/ListOption";
import ListGroup from "@/components/lists/ListGroup";
import SizeIcon from "@/icons/size.svg?jsx";
import AlignLeftIcon from "@/icons/align-left.svg?jsx";
import AlignCenterIcon from "@/icons/align-center.svg?jsx";
import AlignRightIcon from "@/icons/align-right.svg?jsx";
import { handleError } from "@/utils/errors";
import { viewTransition } from "@/utils/transitions";
import { getFontConfig } from "@/utils/fonts";
import { toCSSColor, type Color } from "@/utils/color";
import { themesCache } from "@/utils/cache";
import { getThemeStyles } from "@/utils/themes";
import type { FontId } from "@/config/fonts";
import type { HorizontalAlignment } from "api/types/pages";
import type ListSelect from "@/elements/list-select/ListSelect";
import type Page from "@/models/Page";

export interface StyleTabProps {
  page: Page;
}

export default function StyleTab({ page }: StyleTabProps) {
  const { backgroundColor, font, theme } = page;

  function setFont(newFont: FontId) {
    viewTransition(() => {
      document.body.style.setProperty("--font", getFontConfig(newFont).family);
    });
    page.setFont(newFont).catch(handleError);
  }

  function setColor(value: Color | null) {
    if (!value) {
      return;
    }
    viewTransition(() => {
      document.body.style.setProperty("--background-color", toCSSColor(value));
    });
    page.setBackgroundColor(value).catch(handleError);
  }

  function setTheme(newThemeId: string | null) {
    const newTheme = newThemeId ? themesCache.getById(newThemeId) : null;

    const bgColor = backgroundColor.value;
    const themeStyles = getThemeStyles(newTheme, {
      background: bgColor ? { type: "color", color: bgColor } : null,
      font: font.value,
    });

    viewTransition(() => {
      for (const [property, value] of Object.entries(themeStyles)) {
        document.body.style.setProperty(property, value);
      }
    });

    page.setTheme(newTheme).catch(handleError);
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

  return (
    <toolbar-tab name="style" label="Style">
      <ToolbarGroup label="Style">
        <FontPicker
          value={font}
          onChange={setFont}
          aria-label="Font"
          data-tooltip="Font"
        />

        <ThemePicker
          id="page-theme"
          value={theme}
          onChange={setTheme}
          aria-label="Theme"
          data-tooltip="Theme"
        />

        <ColorPicker
          id="page-color-picker"
          icon={<SolidColorIcon aria-hidden="true" />}
          value={backgroundColor}
          onChange={setColor}
        />

        <list-select
          label="Page width"
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

        <list-select
          label="Alignment"
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
      </ToolbarGroup>
    </toolbar-tab>
  );
}

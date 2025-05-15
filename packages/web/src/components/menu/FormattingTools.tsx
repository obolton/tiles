import ColorPicker from "@/components/inputs/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import { getFontConfig } from "@/utils/fonts";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import { toCSSColor, isDark, type Color } from "@/utils/color";
import type Editor from "@/editor/Editor";
import type { FontId } from "@/config/fonts";

interface FormattingToolbarProps {
  editor: Editor;
}

export default function FormattingToolbar({ editor }: FormattingToolbarProps) {
  const setFont = async (font: FontId) => {
    try {
      viewTransition(() => {
        document.body.style.setProperty("--font", getFontConfig(font).family);
      });
      await editor.setFont(font);
    } catch (error) {
      handleError(error);
    }
  };

  const setColor = async (color: Color | null) => {
    if (!color) {
      return;
    }
    viewTransition(() => {
      if (isDark(color)) {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
      document.body.style.setProperty("--page-color", toCSSColor(color));
    });
    try {
      await editor.setColor(color);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <ul role="group" aria-label="Formatting tools">
      <li role="presentation">
        <FontPicker
          role="menuitem"
          direction="up"
          onChange={setFont}
          aria-label="Font"
          data-tooltip="Select font"
        />
      </li>

      <li role="presentation">
        <ColorPicker
          role="menuitem"
          direction="up"
          onChange={setColor}
          aria-label="Color"
          data-tooltip="Select page color"
        />
      </li>
    </ul>
  );
}

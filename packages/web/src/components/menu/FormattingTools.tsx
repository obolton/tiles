import ColorPicker from "@/components/colors/ColorPicker";
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
  const { color } = editor;

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

  const setColor = async (value: Color | null) => {
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
    try {
      await editor.setColor(value);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <ul role="group" aria-label="Formatting tools">
      <li role="presentation">
        <FontPicker
          role="menuitem"
          onChange={setFont}
          aria-label="Font"
          data-tooltip="Font"
        />
      </li>

      <li role="presentation">
        <ColorPicker value={color} onChange={setColor} />
      </li>
    </ul>
  );
}

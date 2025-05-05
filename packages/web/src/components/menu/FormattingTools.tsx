import ColorPicker from "@/components/inputs/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import type { FontId } from "@/config/fonts";
import { getFontConfig } from "@/utils/fonts";
import { viewTransition } from "@/utils/transitions";
import { handleError } from "@/utils/errors";
import type Editor from "@/editor/Editor";

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

  const setColor = async ({ theme, hue }: ColorPickerValue) => {
    viewTransition(() => {
      switch (theme) {
        case "LIGHT":
          document.body.classList.add("light");
          document.body.classList.remove("dark");
          document.body.classList.remove("color");
          document.body.style.removeProperty("--page-hue");
          break;

        case "DARK":
          document.body.classList.add("dark");
          document.body.classList.remove("light");
          document.body.classList.remove("color");
          document.body.style.removeProperty("--page-hue");
          break;

        case "COLOR":
          document.body.classList.add("color");
          document.body.classList.remove("light");
          document.body.classList.remove("dark");
          document.body.style.setProperty("--page-hue", `${hue}deg`);
          break;
      }
    });
    try {
      await editor.setTheme(theme ?? "LIGHT", hue);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <ul role="group">
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

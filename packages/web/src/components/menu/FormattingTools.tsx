import { useCallback } from "react";
import ColorPicker from "@/components/inputs/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import type { FontId } from "@/config/fonts";
import { getFontConfig } from "@/utils/fonts";
import useEditable from "@/hooks/useEditable";
import { viewTransition } from "@/utils/transitions";
import editor from "@/editor";
import { handleError } from "@/utils/errors";

export default function FormattingToolbar() {
  const isEditable = useEditable();

  const setFont = useCallback(async (font: FontId) => {
    try {
      viewTransition(() => {
        document.body.style.setProperty("--font", getFontConfig(font).family);
      });
      await editor.setFont(font);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const setColor = useCallback(async ({ theme, hue }: ColorPickerValue) => {
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
  }, []);

  if (!isEditable) {
    return null;
  }

  return (
    <>
      <FontPicker direction="left" onChange={setFont} tooltipPosition="left" />
      <ColorPicker
        direction="left"
        onChange={setColor}
        tooltipPosition="left"
      />
    </>
  );
}

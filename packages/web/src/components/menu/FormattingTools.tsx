import { useCallback } from "react";
import ColorPicker from "@/components/inputs/ColorPicker";
import FontPicker from "@/components/inputs/FontPicker";
import type { ColorPickerValue } from "@/components/inputs/ColorPicker";
import type { FontId } from "@/config/fonts";
import { getFontConfig } from "@/utils/fonts";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import { viewTransition } from "@/utils/transitions";

interface FormattingToolbarProps {
  pageId: string;
}

export default function FormattingToolbar({ pageId }: FormattingToolbarProps) {
  const isEditable = useEditable();

  const setFont = useCallback(
    async (font: FontId) => {
      const fontConfig = getFontConfig(font);
      if (!fontConfig) {
        throw new Error(`Invalid font ID: ${font}`);
      }
      viewTransition(() => {
        document.body.style.setProperty("--font", fontConfig.family);
      });
      await client.pages.update.mutate({
        pageId,
        font,
      });
    },
    [pageId],
  );

  const setColor = useCallback(
    async ({ theme, hue }: ColorPickerValue) => {
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
      await client.pages.update.mutate({
        pageId,
        theme: theme ?? "LIGHT",
        hue,
      });
    },
    [pageId],
  );

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

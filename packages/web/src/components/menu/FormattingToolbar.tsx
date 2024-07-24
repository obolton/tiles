import { useCallback } from "react";
import ColorPicker from "@/components/inputs/ColorPicker";
import useEditable from "@/hooks/useEditable";
import client from "@/api/client";
import styles from "./FormattingToolbar.module.css";

interface FormattingToolbarProps {
  pageId: string;
}

export default function FormattingToolbar({ pageId }: FormattingToolbarProps) {
  const isEditable = useEditable();

  const onChangeColor = useCallback(
    async (hue: number) => {
      document.body.style.setProperty("--page-hue", `${hue.toFixed(2)}deg`);
      document.body.classList.add("color");
      await client.pages.update.mutate({
        id: pageId,
        hue,
      });
    },
    [pageId],
  );

  if (!isEditable) {
    return null;
  }

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="Formatting tools"
      aria-orientation="vertical"
    >
      <ColorPicker value={0} onChange={onChangeColor} />
    </div>
  );
}

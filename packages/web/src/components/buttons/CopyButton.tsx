import ToolbarButton from "./ToolbarButton";
import CopyIcon from "@/icons/duplicate.svg?jsx";
import CheckIcon from "@/icons/check.svg?jsx";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import { showToast } from "@/utils/toasts";
import type { ToolbarButtonProps } from "./ToolbarButton";

const COPIED_DURATION = 2000;

export interface CopyButtonProps extends Omit<ToolbarButtonProps, "label" | "children"> {
  /** The text to copy to the clipboard. */
  text: string;
  label?: string;
  /** The toast shown after a successful copy. */
  message?: string;
}

/** A toolbar button that copies `text` to the clipboard and briefly confirms the copy. */
export default function CopyButton({
  text,
  label = "Copy",
  message = "Copied",
  ...props
}: CopyButtonProps) {
  const copied = flag(false);
  let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

  function copy() {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(message, "success");
        copied.on();
        clearTimeout(copiedTimeout);
        copiedTimeout = setTimeout(() => copied.off(), COPIED_DURATION);
      })
      .catch(handleError);
  }

  return (
    <ToolbarButton
      label={copied.derive((value) => (value ? "Copied" : label))}
      on:click={copy}
      {...props}
    >
      {copied.derive((value) =>
        value ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />,
      )}
    </ToolbarButton>
  );
}

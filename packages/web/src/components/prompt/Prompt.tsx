import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import ReferenceList from "./ReferenceList";
import CheckIcon from "@/icons/check.svg?jsx";
import { flag } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import { classNames } from "@/utils/css";
import styles from "./Prompt.module.css";
import type { JSX } from "@/jsx/jsx";

export interface PromptProps extends JSX.Attributes<"form"> {
  className?: string;
  placeholder?: string;
  submitTooltip?: string;
  onSubmit: (prompt: string) => Promise<void>;
  onCancel?: () => void;
}

export default function Prompt({
  className,
  placeholder,
  submitTooltip = "Done",
  onSubmit,
  onCancel,
  ...props
}: PromptProps) {
  const pending = flag(false);

  function handleKeyDown(event: KeyboardEvent) {
    const element = event.currentTarget as HTMLTextAreaElement;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      element.form?.requestSubmit();
    }

    if (
      (event.key === "Escape" || (event.key === "/" && event.metaKey)) &&
      onCancel
    ) {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();

    if (pending.value) {
      return;
    }

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const prompt = (formData.get("prompt") as string).trim();

    if (!prompt) {
      return;
    }

    pending.on();
    onSubmit(prompt)
      .catch(handleError)
      .finally(() => pending.off());
  }

  function handleFocusOut(event: FocusEvent) {
    const form = event.currentTarget as HTMLFormElement;

    if (
      !onCancel ||
      !(event.relatedTarget instanceof Element) ||
      form.contains(event.relatedTarget)
    ) {
      return;
    }

    const prompt = (new FormData(form).get("prompt") as string).trim();
    if (!prompt) {
      onCancel();
    }
  }

  return (
    <form
      {...props}
      className={classNames(styles.prompt, className)}
      on:submit={handleSubmit}
      on:focusout={handleFocusOut}
    >
      <ReferenceList />

      <ResizingTextarea
        name="prompt"
        rows={1}
        placeholder={placeholder}
        title={placeholder}
        required
        readonly={pending}
        on:keydown={handleKeyDown}
      />

      <button
        type="submit"
        classList={{ floating: true, small: true, pending }}
        disabled={pending}
        data-tooltip={submitTooltip}
      >
        <CheckIcon aria-hidden="true" />
      </button>
    </form>
  );
}

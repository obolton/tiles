import ResizingTextarea from "@/components/inputs/ResizingTextarea";
import ReferenceList from "./ReferenceList";
import CheckIcon from "@/icons/check.svg?jsx";
import { flag } from "carillon";
import { handleError } from "@/utils/errors";
import { classNames } from "@/utils/css";
import styles from "./Prompt.module.css";
import type { JSX } from "jsx/jsx";

export interface PromptProps extends JSX.Attributes<"form"> {
  className?: string;
  inputId?: string;
  placeholder?: string;
  submitTooltip?: string;
  /** Extra controls shown before the submit button. */
  actions?: JSX.Node;
  onSubmit: (prompt: string) => Promise<void>;
  onCancel?: () => void;
}

export default function Prompt({
  className,
  inputId,
  placeholder,
  submitTooltip = "Done",
  actions,
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
      (event.key === "Escape" ||
        (event.key === "/" && event.metaKey) ||
        (event.key === "j" && (event.metaKey || event.ctrlKey))) &&
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
    form.reset();
    onSubmit(prompt)
      .catch(handleError)
      .finally(() => pending.off());
  }

  return (
    <form {...props} className={classNames(styles.prompt, className)} on:submit={handleSubmit}>
      <ReferenceList />

      <ResizingTextarea
        id={inputId}
        name="prompt"
        rows={1}
        placeholder={placeholder}
        title={placeholder}
        aria-label={placeholder}
        required
        readonly={pending}
        on:keydown={handleKeyDown}
      />

      {actions && <div className={styles.actions}>{actions}</div>}

      <button
        type="submit"
        classList={{ floating: true, small: true, pending }}
        disabled={pending}
        aria-label={submitTooltip}
        data-tooltip={submitTooltip}
      >
        <CheckIcon aria-hidden="true" />
      </button>
    </form>
  );
}

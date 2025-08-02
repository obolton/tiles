import CheckIcon from "@/icons/check.svg?jsx";
import { flag } from "@/utils/reactivity";
import { handleError } from "@/utils/errors";
import styles from "./Prompt.module.css";

export interface PromptProps {
  placeholder?: string;
  submitTooltip?: string;
  onSubmit: (prompt: string) => Promise<void>;
  onCancel?: () => void;
}

export default function Prompt({
  placeholder,
  submitTooltip = "Done",
  onSubmit,
  onCancel,
}: PromptProps) {
  const pending = flag(false);

  function handleKeyDown(event: KeyboardEvent) {
    const element = event.currentTarget as HTMLTextAreaElement;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      element.form?.requestSubmit();
    }

    if (event.key === "Escape" && onCancel) {
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

  return (
    <form className={styles.prompt} on:submit={handleSubmit}>
      <textarea
        name="prompt"
        placeholder={placeholder}
        required
        disabled={pending}
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

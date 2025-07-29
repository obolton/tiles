import CheckIcon from "@/icons/check.svg?jsx";
import styles from "./Prompt.module.css";

export interface PromptProps {
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
}

export default function Prompt({ onSubmit, onCancel }: PromptProps) {
  function ref(element: HTMLInputElement) {
    requestAnimationFrame(() => element.focus());
  }

  function handlePointerDown(event: PointerEvent) {
    event.stopPropagation();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const prompt = formData.get("prompt") as string;
    if (prompt) {
      onSubmit(prompt);
    } else {
      onCancel();
    }
  }

  return (
    <form
      className={styles.prompt}
      on:pointerdown={handlePointerDown}
      on:keydown={handleKeyDown}
      on:submit={handleSubmit}
    >
      <input
        ref={ref}
        id="prompt"
        type="text"
        name="prompt"
        placeholder="Ask anything"
        autofocus
      />

      <button type="submit" className="floating small">
        <CheckIcon aria-hidden="true" />
      </button>
    </form>
  );
}

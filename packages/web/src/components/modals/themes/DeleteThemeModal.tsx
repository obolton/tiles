import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import { flag } from "carillon";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export interface DeleteThemeModalProps extends ModalProps<void> {
  name: string;
}

export default function DeleteThemeModal({ name, cancel, confirm }: DeleteThemeModalProps) {
  const pending = flag(false);

  async function onSubmit(event: Event) {
    event.preventDefault();

    if (pending.value) {
      return;
    }

    pending.on();
    try {
      await confirm();
    } catch (error) {
      handleError(error);
    } finally {
      pending.off();
    }
  }

  return (
    <form on:submit={onSubmit}>
      <ModalHeader>
        <h2>Delete theme</h2>
      </ModalHeader>

      <ModalBody>
        <p>
          Are you sure you want to delete the <strong>{name}</strong> theme? This cannot be undone.
        </p>
      </ModalBody>

      <ModalFooter>
        <button
          type="submit"
          classList={{ primary: true, destructive: true, pending }}
          data-pending-text="Deleting&#x2026;"
        >
          Delete
        </button>
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

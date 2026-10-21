import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export interface DeleteWorkspaceModalProps extends ModalProps<void> {
  name: string;
}

export default function DeleteWorkspaceModal({ name, cancel, confirm }: DeleteWorkspaceModalProps) {
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
        <h2>Delete workspace</h2>
      </ModalHeader>

      <ModalBody>
        <p>
          This will permanently delete <strong>{name}</strong> and all of its data, including all
          pages, folders, images and themes for every member. This action cannot be undone.
        </p>
      </ModalBody>

      <ModalFooter>
        <button
          type="submit"
          classList={{ primary: true, destructive: true, pending }}
          data-pending-text="Deleting&#x2026;"
        >
          Delete workspace
        </button>
        <button type="button" className="secondary" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}

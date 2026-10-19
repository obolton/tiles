import ModalHeader from "@/components/modals/ModalHeader";
import ModalBody from "@/components/modals/ModalBody";
import ModalFooter from "@/components/modals/ModalFooter";
import { flag } from "reactivity";
import { handleError } from "@/utils/errors";
import type { ModalProps } from "@/utils/modals";

export type DeleteWorkspaceModalProps = ModalProps<void>;

export default function DeleteWorkspaceModal({ cancel, confirm }: DeleteWorkspaceModalProps) {
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
          This will permanently delete this workspace and all of its data, including all pages,
          folders, images and themes. This action cannot be undone.
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
